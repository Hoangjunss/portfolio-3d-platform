# Code review — plan 26 frontend (error log viewer), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `a393305`
**Kết quả:** **100/100 test**, build xanh, đúng phạm vi. Một finding a11y, một điểm polish.

## Phạm vi

    app/admin/(dashboard)/errors/page.tsx | 183 +++
    app/admin/(dashboard)/layout.tsx      |   1 +
    lib/errorLogsApiClient.ts             |  54 ++
    lib/errorLogsApiClient.test.ts        | 114 +++

Không đụng `backend/`, `package.json`, `vitest.config.mjs`. Không tạo `app/admin/layout.tsx`.
Test client không mang docblock jsdom — đúng, nó là test hàm thuần.

## Type khớp tới tận schema, không chỉ tới DTO

Tôi yêu cầu type khớp `SystemErrorLogDto` từng trường **kèm tính nullable**. Kết quả vượt mức: tính
nullable khớp **ràng buộc cột trong `V1__init_schema.sql`**, chứ không phải đoán từ kiểu Java
(`String` trong Java luôn có thể null, nên chỉ đọc record là không đủ để biết trường nào thật sự
nullable).

| Cột | Schema | TS |
|---|---|---|
| `endpoint` | `NOT NULL` | `string` |
| `http_status` | `NOT NULL` | `number` |
| `exception_class` | `NOT NULL` | `string` |
| `message` | nullable | `string \| null` |
| `stacktrace` | nullable | `string \| null` |
| `request_id` | nullable | `string \| null` |
| `created_at` | `NOT NULL` | `string` |

Bảy trên bảy. Và `stacktrace` null được xử ở chỗ render (`log.stacktrace || …`) chứ không để lọt ra
màn hình thành chữ "null".

## Stack trace — đúng yêu cầu plan

`expandedIds: Set<number>` khởi tạo rỗng nên **mặc định thu gọn**; click hàng thì mở inline; `<pre>`
có `whitespace-pre-wrap` + `overflow-x-auto`. Có cả `stopPropagation` trên ô mở rộng để thao tác bên
trong không làm sập hàng — chi tiết dễ quên.

## Finding — mở rộng hàng chỉ dùng được bằng chuột

```tsx
<tr onClick={() => toggleRow(log.id)} className="cursor-pointer …">
```

Không `tabIndex`, không `onKeyDown`, không `role="button"`, không `aria-expanded`.

Bên trong hàng đã mở có `<details>` — cái đó **dùng được bằng bàn phím**, vì `<summary>` là phần tử
focus được. Nhưng nó chỉ tồn tại **sau khi** hàng đã mở, mà bước mở lại chỉ có chuột. Người dùng bàn
phím không tới được stack trace — tức không tới được **thứ duy nhất màn hình này tồn tại để xem**.
Trình đọc màn hình cũng không có tín hiệu nào cho biết hàng bấm được hay đang mở/đóng.

Không phải lỗi so với plan: `grep -i "keyboard\|aria\|tabindex\|focus\|a11y"` trên plan 26 **không
khớp dòng nào**. Đây là lỗ hổng của cả plan lẫn bản làm.

Sửa nhỏ: `tabIndex={0}`, `role="button"`, `aria-expanded={isExpanded}`, và `onKeyDown` bắt
Enter/Space.

## Polish — hai chuỗi tiếng Anh nữa

    "(No stack trace available)"
    "(No error message)"

Cùng họ với `"Not allowed"` và `"Cannot deactivate the last active admin"` đã ghi ở plan 24. Nợ Việt
hoá giờ gom được 4 chuỗi, đủ để làm một lượt.

## Test

5 case, khuôn giống `auditLogApiClient.test.ts`: happy path, lỗi server có `message`, lỗi server
**không** có `message` (nhánh fallback), `fetch` reject bằng `mockRejectedValue`, và mặc định
page/size + `unwrapPage`. Page có `cancelled` guard chống `setState` sau unmount.

## Ship

Đã push. **Plan 26 xong cả hai task.** Nợ dọn dẹp admin lên **5 mục** (thêm a11y hàng mở rộng).
