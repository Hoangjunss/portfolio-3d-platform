# Code Review — A-01/A-02/A-03 + Plan 05 (Template CRUD)

**Ngày:** 2026-09-20
**Phạm vi:** `6c07c2e` (piece 1: allow-list + A-02 + A-03) + `0795459` (piece 2: plan 05)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-05-template-crud.md`
**Review trước:** `docs/reviews/2026-09-20-code-review-plan-04b.md` (nguồn của A-01…A-03)
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **34/34 PASS**, 3 lần chạy liên tiếp |
| Số test trước / sau | 26 → 34, đúng con số plan dự báo |
| Piece 1 (A-01, A-02, A-03) | **Xong cả ba** |
| Piece 2 (plan 05, 5 task) | **Xong cả năm** |
| Hai commit riêng | Đúng yêu cầu |

### Mutation check — 9/9 đỏ đúng chỗ

Tôi tự chạy toàn bộ, không dùng kết quả Antigravity tự báo:

| # | Revert gì | Test | Kết quả |
|---|---|---|---|
| M1 | `listActive` bỏ lọc `active` | `TemplateServiceTest` | RED |
| M1b | như trên | `PublicTemplateControllerTest` | RED |
| M2 | `incrementClickCount` → `findById` (bỏ atomic) | `TemplateServiceTest` | RED |
| M3 | `update` ném `IllegalStateException` thay vì `ResourceNotFoundException` | `TemplateServiceTest` | RED |
| M4 | `softDelete` bỏ `setActive(false)` | `TemplateServiceTest` | RED |
| M5 | bỏ `@Audited` khỏi `create` | `AdminTemplateControllerTest` | RED |
| M6 | siết `/api/admin/**` về `hasRole("ADMIN")` | `AdminTemplateControllerTest` | RED |
| M7 | `converter` import `repository` | `LayerDependencyTest` | RED |
| M8 | `service` import `facade` | `LayerDependencyTest` | RED |

M7 và M8 là hai luật **mới được phủ** nhờ A-01. Trước hôm nay cả hai vi phạm này đều lọt.

### Sáu lỗi của plan 05 bản cũ — không tái phát

| Lỗi cũ | Trạng thái |
|---|---|
| `TemplateDto.from(entity)` | Không còn; `TemplateDto` không nhắc tới `model`, chuyển đổi nằm ở `TemplateConverter` |
| `createdBy` luôn null | Đã resolve: controller lấy `auth.getName()`, service tra `UserService.findIdByUsername` |
| Click counter đọc-sửa-ghi | Thay bằng `@Modifying @Query` bulk update, M2 chứng minh có test giữ |
| `EntityNotFoundException` → 500 | Thay bằng `ResourceNotFoundException` → 404, handler có comment "no system_error_logs row" |
| Test public chỉ assert 200 | Đã seed active/inactive/soft-deleted và phân biệt được (M1b đỏ) |
| Không có bằng chứng `@Audited` chạy | `create_asAdmin_writesAuditLogRow` qua MockMvc, M5 đỏ |

Tên derived query cũng đúng: `findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc` — field
là `active`, cột là `is_active`. Sai chỗ này thì hỏng lúc khởi động context chứ không phải lúc
biên dịch.

### A-01 — allow-list giờ đầy đủ và deny-by-default

`ALLOWED_DEPENDENCIES` phủ 16 package, mỗi tầng một tập cho phép, và `allowed == null` nghĩa là
chặn hết. Antigravity có bổ sung vài mục so với bản tôi chỉ định — `service` thêm `form` và
`annotation`, `facade` thêm `exception`, thêm `repository → model, enums` và `model → enums`.
Tất cả đều cần thật và đều hợp luật. Đây là dấu hiệu nó **chạy test rồi sửa** chứ không đoán.

---

## Phát hiện

### T-01 — `create(TemplateUpsertForm, Long createdBy)` là code chết trên interface công khai (MINOR)

`TemplateService` khai báo **hai** overload:

```java
Long create(TemplateUpsertForm form, String username);
Long create(TemplateUpsertForm form, Long createdBy);
```

Cả hai đều được implement đầy đủ, thân hàm gần như trùng nhau, và cả hai đều mang `@Audited` +
`@CacheEvict` + `@Transactional`. Nhưng **chỉ overload `String` được gọi** — grep toàn bộ
`src/main` và `src/test` chỉ ra đúng một call site, ở `AdminTemplateController:31`. Overload
`Long` là tàn dư của signature trong bản plan cũ.

Hai lý do không nên để lại:

1. **`TemplateService` là khuôn mẫu plan 06–10 sẽ sao chép.** Một method chết trên interface đầu
   tiên của dự án sẽ được nhân bản sang content, media, lead, settings.
2. **`create(form, null)` sẽ không biên dịch được** — hai overload khiến lời gọi đó nhập nhằng.
   Người viết plan 14 (admin dashboard) rất dễ đụng, và thông báo lỗi của javac ở trường hợp này
   không gợi ý gì về nguyên nhân.

Sửa: xoá overload `Long` khỏi cả interface lẫn impl.

### T-02 — `viewCount` vẫn không có chỗ nào ghi (MINOR)

Cột `view_count` có trong `V1__init_schema.sql`, có trong `model/Template`, có trong
`TemplateDto` — và không dòng code nào tăng nó. Carousel của plan 12 sẽ hiển thị 0 vĩnh viễn.

Plan 05 self-review đã nêu và chuyển cho plan 08. Nhắc lại ở đây để nó không trôi: **plan 08 phải
hoặc wire cột này, hoặc bỏ nó khỏi `TemplateDto`.** Một field luôn bằng 0 tệ hơn một field không
tồn tại, vì FE sẽ vẽ nó ra.

### T-03 — Handler 404 trả `ex.getMessage()` ra client (INFO)

```java
.body(new ApiErrorDto("NOT_FOUND", ex.getMessage(), null));
```

Với `ResourceNotFoundException("Template", 999)` thì nội dung là "Template 999 not found" — vô
hại và hữu ích. Nhưng nó **khác chuẩn** đã đặt cho 500, nơi message bị cố định thành
`"Something went wrong"` đúng để không rò SQL/đường dẫn/username.

Không phải lỗi. Ghi lại để plan sau không suy ra rằng trả `ex.getMessage()` là được phép ở mọi
handler — nó chỉ an toàn vì `ResourceNotFoundException` là exception **của ta**, nội dung do ta
dựng từ entity type + id.

### T-04 — Cache `public-templates` vẫn chưa có TTL (INFO)

`@Cacheable("public-templates")` đang dùng cấu hình mặc định của cache manager. Spec mục 5 nói
"short TTL" nhưng chưa có con số. Plan 06 thêm endpoint cache thứ hai, nên nó là chỗ hợp lý để
tạo **một** `CacheConfig` với TTL tường minh cho cả hai — đừng để mỗi plan tự nghĩ ra một giá trị.

### T-05 — `config` và `filter` được miễn hoàn toàn khỏi allow-list (INFO)

`EXEMPT_LAYERS = {config, filter, root}`. Nghĩa là `SecurityConfig` có thể import thẳng một
repository mà `LayerDependencyTest` không nói gì. Tôi là người chỉ định cách miễn này, và nó có
lý — `config` phải wire bean xuyên tầng, `filter` theo skill là node cao nhất được gọi mọi thứ.

Nhưng đây là lỗ hổng duy nhất còn lại của allow-list, nên ghi ra để biết. Nếu sau này `config/`
phình lên thì nên siết lại thành allow-list riêng thay vì miễn trắng.

---

## Điều làm tốt

- **Bằng chứng đầu tiên trong dự án rằng `@Audited` thật sự ghi row.** Test đi qua MockMvc nên AOP
  proxy nằm trong đường đi; assert đúng `entity_type`, `action`, và `entity_id` khớp id trả về.
  Đóng R-02 của review plan 04.
- `create_asEditor_isAllowed` có trọng lượng thật (M6 đỏ). Quy tắc `/api/admin/**` cấp quyền cho
  EDITOR, và một lần siết nhầm về ADMIN-only sẽ khoá im lặng một nửa số người dùng — giờ có test
  chặn.
- Allow-list được bổ sung đúng chỗ cần thay vì copy nguyên bản tôi đưa, chứng tỏ có chạy thật.
- `applyForm` trong converter không đụng `createdBy`, `createdAt`, `viewCount`, `clickCount`,
  `deletedAt` — đúng yêu cầu, những field đó không phải của client.
- Comment giải thích mới đều là WHY, không phải WHAT (`// 404 is the caller's fault, not a system
  fault — no system_error_logs row.`).

---

## Kết luận

**VERDICT: PASS — đủ điều kiện push.**

Hai piece xong đủ, 34/34 ổn định ba lần chạy, 9/9 mutation đỏ, sáu lỗi của plan 05 bản cũ không
cái nào tái phát, và hai luật kiến trúc mới đã chứng minh bắt được vi phạm thật.

T-01 là thứ duy nhất nên sửa sớm, và lý do không phải vì nó gây lỗi hôm nay mà vì
`TemplateService` sẽ là khuôn cho năm module tiếp theo.

| Finding | Xử lý |
|---|---|
| T-01 | Gộp vào đầu plan 06 — xoá overload `Long` |
| T-02 | **Plan 08 phải quyết**: wire `view_count` hoặc bỏ khỏi `TemplateDto` |
| T-04 | Plan 06 tạo `CacheConfig` với TTL tường minh cho cả hai cache |
| T-03, T-05 | Ghi nhận, không chặn |
