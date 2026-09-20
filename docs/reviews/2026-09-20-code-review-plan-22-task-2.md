# Code review — plan 22 Task 2, lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `f2f06e9`
**Kết quả:** đủ file, đúng phạm vi, **73/73 test**, build xanh. Một quan sát nhỏ, không chặn.
Đáng chú ý: lượt này **tự tránh được đúng cái bẫy đã tạo ra F-01 ở plan 21**.

## Phạm vi

    frontend/app/admin/(dashboard)/content/page.tsx    | 118 +++
    frontend/app/admin/(dashboard)/layout.tsx          |   1 +
    frontend/components/admin/ContentSectionForm.tsx   | 265 +++
    frontend/components/admin/ContentSectionForm.test.tsx | 132 +++
    frontend/lib/contentSectionShapes.ts               | 140 +++

| Ràng buộc | Kết quả |
|---|---|
| Không đụng `backend/` | ✅ |
| Không đụng `package.json` / lockfile / `vitest.config.mjs` | ✅ |
| **Không tạo `app/admin/layout.tsx`** | ✅ không tồn tại |
| Màn mới nằm trong `(dashboard)` | ✅ |
| Docblock `// @vitest-environment jsdom` | ✅ dòng đầu |

## Hai chỗ tôi cảnh báo trong lượt giao — cả hai xử đúng

### `unwrapPage` trên mảng phẳng

Endpoint trả JSON array, không phải page object. Lượt giao vẫn dùng `unwrapPage` — và **đúng**,
vì hàm đó có nhánh mảng trước:

```ts
if (Array.isArray(body)) return body as T[];
```

Không phải dùng bừa; nó hợp lệ cho cả hai dạng.

### Shape của PUT

Frontend gửi `JSON.stringify({ dataJson })`. Backend nhận:

```java
public record ContentSectionUpsertForm(@NotBlank String dataJson) {}
```

Khớp. Và `Content-Type: application/json` không bị quên — `withAuth` trong `adminApiClient.ts` set
sẵn cho mọi request, nếu thiếu thì Spring trả 415.

## Điều đáng khen — tránh được lớp lỗi F-01

F-01 ở plan 21 là: promise reject thoát ra ngoài `try`, form kẹt vĩnh viễn. Ở đây `onSave` có kiểu
`Promise<void> | void`, tức **rất dễ tái phạm**: gọi mà không `await` thì `catch` không bắt được gì.

Code thực tế:

```ts
try {
  const res = onSave(sectionKey, serialized);
  if (res instanceof Promise) {
    await res;
  }
  setSaveStatus("saved");
} catch (err: unknown) {
  ...
} finally {
  setIsSaving(false);
}
```

`await` nằm **trong** `try`, và `finally` mở khoá nút. Quan trọng hơn, test phủ đúng nhánh async:

```ts
const onSave = vi.fn().mockRejectedValue(new Error("Lỗi lưu"));
```

`mockRejectedValue` chứ không phải throw đồng bộ — tức nó kiểm đúng đường mà plan 21 bỏ lọt. Phía
load cũng có `try/catch` riêng, trả "Cannot reach the server."

## Tự kiểm

| Kiểm | Kết quả |
|---|---|
| Test suite | **73/73 PASS**, 20 file (64 + 9 mới) |
| Build + type-check | xanh, route `/admin/content` xuất hiện |
| `/admin/content` chưa auth | **307** — middleware `/admin/:path*` phủ tới ✅ |
| `/admin/login` rò chrome public | **0** ✅ |
| `/` | 200 ✅ |

## Quan sát nhỏ — không chặn

`handleSave` khi gặp 401 làm hai việc cùng lúc:

```ts
router.push("/admin/login");
throw new Error("Unauthorized");
```

`throw` là cần thiết để form không hiện "đã lưu", nhưng hệ quả là người dùng thấy alert đỏ
"Unauthorized" trong khoảnh khắc trang đang chuyển sang màn đăng nhập. Không sai, chỉ hơi nhiễu.
Sửa được bằng một reason riêng để form im lặng khi đang điều hướng — để lại cho lượt dọn UI admin.

## Ship

Đã push. **Plan 22 xong cả 2 task.**
