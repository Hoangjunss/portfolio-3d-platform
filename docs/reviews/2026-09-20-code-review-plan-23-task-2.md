# Code review — plan 23 Task 2 (media grid), lượt 1: **PASS có điều kiện**

**Ngày:** 2026-09-20
**Commit:** `cf577db`
**Kết quả:** **79/79 test**, build xanh, đúng phạm vi. Một finding thật, kiểm bằng thực nghiệm.

## Phạm vi

    app/admin/(dashboard)/layout.tsx     |   1 +
    app/admin/(dashboard)/media/page.tsx | 156 +++
    components/admin/MediaGrid.tsx       | 209 +++
    components/admin/MediaGrid.test.tsx  |  90 +++

`backend/`, `package.json`, `vitest.config.mjs`: không đụng. `app/admin/layout.tsx`: không tạo.
Docblock jsdom đúng dòng đầu. Route `/admin/media` có trong build.

## Bài học F-01 đã được áp dụng

Handoff dặn kỹ vì repo này từng có form đứng cứng do rejection thoát khỏi `catch`. Lần này đúng:

```ts
try {
  await onDelete(id);
} catch {
  setErrorMap(...)
} finally { ... }
```

`await` nằm **trong** `try`, `finally` mở khoá. Test dùng `mockRejectedValue` chứ không throw đồng
bộ. Xác nhận xoá hai bước (`confirmingId !== id` → set rồi return) cũng đúng plan. `setTimeout` của
chỉ báo "đã sao chép" được dọn trong cleanup của `useEffect`.

---

## F-01 (MINOR) — báo "Đã sao chép" khi chưa chép gì

```ts
try {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  }
  setCopiedId(id);        // <- chạy vô điều kiện
```

Optional chaining chặn được crash — tốt. Nhưng `setCopiedId(id)` nằm **ngoài** `if`, nên khi API
vắng mặt, nhánh copy bị bỏ qua mà lớp phủ `role="status"` vẫn hiện.

Kiểm bằng probe, xoá `navigator.clipboard` rồi click ảnh:

    clipboard API : undefined
    UI nói với user: Đã sao chép

Admin tin là URL đã nằm trong clipboard, dán ra, và nhận nội dung cũ còn sót — có thể là URL của
ảnh khác vừa copy trước đó. Sai âm thầm, không lỗi ở đâu cả.

**Khi nào `navigator.clipboard` là `undefined`?** Ở **non-secure context**, tức HTTP thuần. Không
phải giả định xa vời với dự án này: `docs/ops/ci-cd-secrets.md` ghi rõ chứng chỉ TLS là bước
**DNS-01 thủ công mà pipeline không làm**, nên tồn tại quãng thời gian thật khi admin được truy cập
qua HTTP và API này biến mất.

**Vì sao test không bắt được:** cả hai test clipboard đều tự dựng sẵn một `writeText` chạy được:

```ts
Object.assign(navigator, { clipboard: { writeText } });
```

Không test nào chạy ở trạng thái API vắng mặt — đúng nhánh sinh ra lỗi.

Đáng chú ý: nhánh `writeText` **reject** (từ chối quyền) lại xử đúng — `setCopiedId` nằm sau
`await` nên bị bỏ qua, không có xác nhận giả. Chỉ riêng nhánh API vắng mặt là sai.

Sửa: chuyển `setCopiedId(id)` vào trong `if`, và ở `else` hiện một fallback (ví dụ chọn sẵn text
URL để người dùng tự Ctrl+C) thay vì im lặng.

## F-02 (rất nhỏ) — câu báo lỗi xoá nói sai nguyên nhân

    "Không xoá được ảnh. Máy chủ từ chối yêu cầu. Thử lại."

Đúng cấu trúc 3 phần của dự án, nhưng "máy chủ từ chối" được dùng cho **mọi** lỗi, kể cả khi
`fetch` reject vì không kết nối được — lúc đó máy chủ không từ chối gì, nó không nghe thấy.

---

## Ship

Đã push. Cả hai finding không chặn — xoá và danh sách hoạt động đúng.

**Nợ dọn dẹp admin, giờ là 3 mục**, gộp một lượt sau:
1. `delete(Long id, String username)` — tham số chết (plan 23 Task 1)
2. Alert "Unauthorized" nháy lên khi đang điều hướng (plan 22 Task 2)
3. F-01 + F-02 ở trên
