# Code review — plan 27 frontend (settings page), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `8caf9be`
**Kết quả:** **106/106 test**, build xanh, đúng phạm vi. Một finding nhỏ, và nó bắt nguồn từ chính
câu dặn của tôi.

## Phạm vi — lần này đúng đề

Lượt trước ở đúng task này nó làm **0/4** và thay vào đó commit một spec 315 dòng mở rộng phạm vi.
Lần này handoff nói thẳng "SCOPE IS EXACTLY FOUR THINGS", cấm đụng `docs/`, và kết quả:

    app/admin/(dashboard)/layout.tsx        |   1 +
    app/admin/(dashboard)/settings/page.tsx | 398 +++
    lib/settingsApiClient.ts                |  53 ++
    lib/settingsApiClient.test.ts           | 111 +++

`backend/`, `docs/`, `package.json`, `vitest.config.mjs`: không đụng. Không tạo `app/admin/layout.tsx`.

## Điểm tôi nhấn mạnh nhất — 403 khác 401 — làm đúng

Đây là màn admin duy nhất bị chặn ở mức `hasRole("ADMIN")` thay vì `/api/admin/**` chung, nên EDITOR
nhận **403** chứ không phải 401. Đẩy người dùng về `/admin/login` khi họ đã đăng nhập rồi là vô
nghĩa.

```ts
if (apiErr.status === 401) { router.push("/admin/login"); return; }
if (apiErr.status === 403) { setIsForbidden(true); setError(…); return; }
```

Và màn hình 403 có nội dung riêng, **bằng tiếng Việt**:

> Truy cập bị từ chối (403 Forbidden)
> Tài khoản của bạn không có quyền truy cập trang này. Chỉ quản trị viên (ADMIN) mới có quyền…

### Để làm được thế, nó nâng cấp shape lỗi của client

Ba client trước (`userApiClient`, `auditLogApiClient`, `errorLogsApiClient`) đều ném `Error` trần chỉ
mang message — nên **không thể** phân biệt 401 / 403 / 500. Client này định nghĩa hẳn một lớp:

```ts
class ApiError extends Error {
  status: number; code?: string; requestId?: string | null;
}
```

Đây là bản tốt nhất trong repo. Hệ quả phụ: giờ có **hai** shape lỗi client song song. Nên thống
nhất về `ApiError` ở lượt dọn, vì ba client kia đang chặn chính khả năng phân biệt status.

## Khớp hợp đồng backend

| | |
|---|---|
| PUT body | `JSON.stringify({ valueJson })` ↔ `record SettingUpsertForm(@NotBlank String valueJson)` ✅ |
| GET trả mảng phẳng, không phải page | xử đúng, không ép qua khuôn page ✅ |

## Test — 6 case, có cả case riêng của màn này

    fetchSettings requests /api/admin/settings and returns settings
    saveSetting sends PUT /api/admin/settings/{key} with valueJson
    surfaces 403 forbidden error when user lacks ADMIN role       <- riêng màn này
    surfaces server error message from body.message
    surfaces fallback error message when body has no message
    surfaces network failure when fetch rejects

## Finding (MINOR) — `role`/`tabIndex`/`onKeyDown` gắn thừa lên `<button>`

```tsx
<button type="button" role="button" tabIndex={0}
        onClick={handleAddLink}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleAddLink(); } }}>
```

`<button>` **vốn đã** focus được, đã có implicit `role="button"`, và đã tự phát `click` khi nhấn
Enter/Space. Cả ba thuộc tính thêm vào đều không cần.

Hiện tại **không lỗi**: `e.preventDefault()` huỷ hành vi kích hoạt mặc định nên hàm chỉ chạy một
lần. Nhưng đó là một sự cân bằng mong manh — `preventDefault()` trên một `<button>` trông thừa thãi,
và người dọn code sau rất dễ bỏ nó đi. Bỏ xong thì Enter sẽ kích hoạt **hai lần**: một lần từ click
tổng hợp của trình duyệt, một lần từ `onKeyDown`. Với "+ Thêm liên kết" nghĩa là thêm hai dòng; với
nút xoá thì tệ hơn vì index đã dịch sau lần xoá đầu.

> **Ghi rõ:** đây là lập luận theo đặc tả, **không phải đo**. jsdom không cài hành vi kích hoạt
> Enter cho `<button>`, nên một probe ở đây sẽ cho kết quả sai lệch chứ không kết luận được.

**Và lỗi này một phần là của tôi.** Handoff tôi viết: *"If any element is clickable or expandable,
give it `tabIndex={0}`, a `role`, `aria-expanded` and an Enter/Space `onKeyDown`"* — câu đó ra đời
sau hàng mở rộng chỉ-dùng-chuột ở màn error-log, nơi phần tử là `<tr>` và thật sự cần. Áp lên
`<button>` thì thành thừa. Lần sau phải viết: *"chỉ khi phần tử không phải `<button>` hay `<a>`"*.

Cách sửa: bỏ `role`, `tabIndex`, `onKeyDown`, giữ nguyên `onClick`.

## Ship

Đã push. **Plan 27 xong cả hai task.** Còn lại **plan 28**.
