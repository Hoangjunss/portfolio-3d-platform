# Code review — plan 25 frontend (audit log viewer), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `72e9676`
**Kết quả:** **95/95 test**, build xanh, đúng phạm vi. **Không finding nào.**

## Phạm vi

    app/admin/(dashboard)/audit-log/page.tsx | 182 +++
    app/admin/(dashboard)/layout.tsx         |   1 +
    lib/auditLogApiClient.ts                 |  51 ++
    lib/auditLogApiClient.test.ts            | 116 +++

Không đụng `backend/`, `package.json`, `vitest.config.mjs`. Không tạo `app/admin/layout.tsx`.
`auditLogApiClient.test.ts` không mang docblock jsdom — đúng, nó là test hàm thuần.

## Rủi ro lớn nhất của màn này đã được xử

`entityType` là **bắt buộc** ở backend; một màn "xem audit log" gửi request trống lúc vẽ đầu sẽ tự
400 ngay trước mắt người dùng. Ở đây:

```ts
const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
```

Mặc định `"Template"`, nên request đầu tiên là `?entityType=Template`. Không có 400 lúc khởi tạo.

## Danh sách filter khớp thực tế, không phải đoán

`ENTITY_TYPES` là hardcode — dạng rất dễ sai, và sai thì **không báo lỗi**: chọn một giá trị không
tồn tại chỉ ra bảng rỗng, người đọc hiểu nhầm thành "không có hoạt động nào".

Đối chiếu với mọi `@Audited` trong backend:

| backend ghi | frontend liệt kê |
|---|---|
| `ContentSection`, `Lead`, `Media`, `Setting`, `Template`, `User` | `Template`, `ContentSection`, `Lead`, `User`, `Setting`, `Media` |

Sáu chuỗi khớp chính xác, không thiếu, không thừa. Tức là có đọc annotation backend chứ không đoán.

## Type khớp DTO từng trường

`AuditLogDto` (backend) và `AuditLog` (frontend) trùng khít cả 9 trường, đúng thứ tự, đúng tính
nullable: `id, userId, action, entityType, entityId, oldValueJson, newValueJson, ipAddress,
createdAt`. Không có trường nào render ra rỗng vì gõ sai tên.

## Client chuẩn hoá shape thay vì phó mặc cho component

Tôi tưởng nó bỏ qua `unwrapPage` vì page component đọc thẳng `data.content`. Đọc kỹ thì ngược lại —
`unwrapPage` nằm trong client, và client tự dựng lại `totalPages`/`number` kèm fallback:

```ts
const content = unwrapPage<AuditLog>(body);
const totalPages = typeof body?.totalPages === "number" ? body.totalPages
                                                        : (content.length > 0 ? 1 : 0);
```

Component chỉ thấy một shape ổn định. Query cũng dựng bằng `URLSearchParams` chứ không nối chuỗi
tay, nên mã hoá đúng.

## Xử lý lỗi

`await` trong `try`, `catch` set thông điệp, và có guard `cancelled` chặn `setState` sau khi
unmount — thứ dễ quên trong `useEffect` có async.

Test 6 case, gồm hai case tôi không yêu cầu nhưng đáng có:

    listAuditLogs surfaces fallback error message when body has no message
    listAuditLogs surfaces network failure when fetch rejects

Cái đầu phủ đúng nhánh `body.message ?? \`Request failed (${res.status})\`` — nhánh chỉ chạy khi
server trả lỗi không đúng shape `ApiErrorDto`.

## Ship

Đã push. **Plan 25 xong cả hai task.**
