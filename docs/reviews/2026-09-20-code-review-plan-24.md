# Code review — plan 24 (admin user management), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `b587119`
**Kết quả:** **89/89 test**, build xanh, đúng phạm vi. **Không finding nào.** Lượt sạch nhất từ đầu
chuỗi plan admin.

## Phạm vi

    app/admin/(dashboard)/layout.tsx     |   1 +
    app/admin/(dashboard)/users/page.tsx | 232 +++
    lib/userApiClient.ts                 |  76 +++
    lib/userApiClient.test.ts            | 125 +++

| Ràng buộc | Kết quả |
|---|---|
| Không đụng `backend/`, `package.json`, `vitest.config.mjs` | ✅ |
| Không tạo `app/admin/layout.tsx` | ✅ |
| `userApiClient.test.ts` **không** có docblock jsdom (test hàm thuần) | ✅ |
| Không khai lại `NEXT_PUBLIC_API_BASE_URL` | ✅ 0 lần |
| Route `/admin/users` trong build | ✅ |

## Ba quy tắc xử lý lỗi tôi đặt ra — áp dụng có hệ thống

Không chỉ đúng một chỗ, mà đúng **mọi** chỗ. Cả bốn hàm async trong page đều có `await` nằm **trong**
`try` kèm `catch`. Và `createUser` chỉ reset form **sau khi** `await createUser(form)` thành công —
không có xác nhận giả, đúng bài học vừa rút từ `MediaGrid`.

Test phủ theo ma trận, mỗi thao tác ba nhánh:

| | thành công | lỗi server | `fetch` reject |
|---|---|---|---|
| `listUsers` | ✅ | ✅ | ✅ |
| `createUser` | ✅ | ✅ | ✅ |
| `deactivateUser` | ✅ | ✅ | ✅ |

Ba test `mockRejectedValue` — đúng nhánh mà F-01 của plan 21 từng bỏ lọt, giờ được phủ mặc định.

## Thông điệp lỗi đi tới được người dùng — kiểm xuyên tầng

`userApiClient` bóc `body.message` rồi ném lên:

```ts
const body = await res.json().catch(() => ({ message: "Request failed" }));
throw new Error(body.message ?? `Request failed (${res.status})`);
```

Cái này chỉ có tác dụng nếu shape lỗi của backend thật sự có `message` ở cấp cao nhất. Kiểm:

```java
public record ApiErrorDto(String code, String message, String requestId) {}
```

Có. Nên guard chống khoá chết của backend —
`throw new InvalidRequestException("Cannot deactivate the last active admin")` —
đi thẳng tới màn hình thay vì biến thành "Request failed (400)" vô nghĩa.

Và test **ghim đúng chuỗi thật**, không phải chuỗi bịa:

```ts
json: async () => ({ message: "Cannot deactivate the last active admin" }),
await expect(deactivateUser(1)).rejects.toThrow("Cannot deactivate the last active admin");
```

Khớp từng ký tự với `UserManagementServiceImpl.java:88`.

## Link "Users" hiện cho cả EDITOR — đúng chủ ý, không phải sót

`layout.tsx` thêm link vô điều kiện. Thoạt nhìn giống lỗi phân quyền, nhưng plan dòng 71-73 đã quyết
và lập luận đúng:

> the link is shown to everyone, the server 403s EDITOR — **do not hide the link based on
> client-decoded JWT claims, that's a spoofable client check, not a security boundary**

Ranh giới thật nằm ở `SecurityConfig`: `/api/admin/users/**` → `hasRole("ADMIN")`. EDITOR bấm vào sẽ
nhận 403 kèm body `ApiErrorDto("FORBIDDEN", "Not allowed")` từ `accessDeniedHandler`, tức một thông
báo thật chứ không phải trang vỡ.

## Điểm gọt giũa — không phải lỗi, gộp vào lượt dọn admin

Hai chuỗi lỗi mà người dùng sẽ đọc đều là **tiếng Anh** trong một giao diện admin tiếng Việt
("Quản lý nội dung", "Không xoá được ảnh…"):

- `"Not allowed"` — EDITOR mở màn Users
- `"Cannot deactivate the last active admin"` — chạm guard khoá chết

Cả hai là copy có sẵn ở backend, không do plan 24 sinh ra, nhưng màn hình này là chỗ đầu tiên chúng
lộ ra trước mắt người dùng. Việt hoá ở tầng backend hoặc map sang copy tiếng Việt ở `userApiClient`.

## Ship

Đã push. Nợ dọn dẹp admin lên **4 mục** (thêm mục Việt hoá hai chuỗi trên).
