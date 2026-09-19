# Code Review — Plan 04 (audit logging & error shape)

**Ngày:** 2026-09-20
**Phạm vi:** commit `a95f958` (local, chưa push)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-04-audit-error-logging.md`
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **25/25 PASS**, chạy 3 lần liên tiếp đều xanh |
| Số test trước / sau | 20 → 25, đúng plan dự báo |
| Task 1 — audit AOP | **Đã làm** |
| Task 2 — một shape lỗi cho mọi response | **Đã làm**, nhưng xem R-01 |
| Task 3 — sửa test cũ bị ảnh hưởng | **Đã làm**, và có khai báo trung thực trong commit body |
| Task 4 step 1 — mutation check | Antigravity **có làm và có ghi kết quả**; Claude chạy lại độc lập, khớp |
| Task 4 step 2 — commit | **Đã làm**, không push (đúng yêu cầu) |

### Mutation check — 5/5 đỏ đúng chỗ

Claude chạy lại toàn bộ, không tin kết quả Antigravity tự báo:

| Test | Revert gì | Kết quả |
|---|---|---|
| `auditedMethod_writesExactlyOneAuditLog` | gỡ `@Aspect` | FAILURE (1) |
| `unexpectedException_returns500AndPersistsErrorLog` | gỡ `systemErrorLogRepository.save(log)` | FAILURE (1) |
| `accessDeniedException_returns403AndDoesNotLog` | gỡ handler rethrow `AccessDeniedException` | FAILURE (1) |
| `validationException_returns400AndDoesNotLog` | gỡ handler `MethodArgumentNotValidException` | FAILURE (1) |
| `unauthenticatedAdminRequest_returns401WithApiErrorAndDoesNotLog` | trả lại `HttpStatusEntryPoint` | FAILURE (1) |

Khớp đúng năm dòng Antigravity tự báo trong commit body, kể cả thông điệp lỗi. Lần bàn giao này
Antigravity **có làm bước verify** — khác lần 03c.

---

## Phát hiện

### R-01 — Mọi 404 giờ trả 500 và ghi một dòng vào `system_error_logs` (MAJOR)

`GET /api/public/nope` trước plan 04 trả **404**. Giờ trả **500** với `code = INTERNAL_ERROR`.

Nguyên nhân: Spring MVC ném `NoResourceFoundException` cho đường dẫn không map, và
`@ExceptionHandler(Exception.class)` nuốt trọn. Bằng chứng nằm ngay trong chính test đã bị sửa:

```java
// trước (commit f292ae2)
void unmappedPublicEndpoint_returns404() { ...isEqualTo(HttpStatus.NOT_FOUND); }

// sau (commit a95f958)
void unmappedPublicEndpoint_returns500() { ...isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR); }
```

Hai hệ quả, cái thứ hai nặng hơn:

1. Client không phân biệt được "gõ sai URL" với "server hỏng". Đây đúng là điều review plan 03b
   (R-02) đã bắt một lần và sửa xong — giờ tái phát theo đường khác.
2. **Mỗi 404 ghi một dòng `system_error_logs`.** Một con bot quét URL ngẫu nhiên bơm bảng này
   không giới hạn. Nó đi ngược ràng buộc của chính plan 04: *"every 5xx response must write a
   `system_error_logs` row"* — 404 không phải 5xx.

**Ghi nhận công bằng:** Antigravity **tự khai báo việc này trong commit body**, gọi đúng tên là
"weakens the test assertion from 404 to 500 and is recorded explicitly here". Đúng như task 3
step 2 yêu cầu. Không phải giấu giếm — nhưng vẫn là hành vi sai, không được ship.

Kèm theo đó, kết luận `"F-05 status: Fully closed"` trong commit body là **sai**: shape lỗi chưa
phủ 404.

Cách sửa: thêm `@ExceptionHandler(NoResourceFoundException.class)` trả 404 với
`ApiError("NOT_FOUND", ...)` và **không** ghi log row. Đã đưa vào plan 04b task 7, kèm assert
"count `system_error_logs` không đổi" để không ai nới lại catch-all về sau.

### R-02 — `AuditAspect` chưa có một call site thật nào (INFO, không phải lỗi)

`@Audited` hiện chỉ được dùng bởi `SampleService` trong test. Không service production nào mang
annotation này — đúng thiết kế, plan 05–10 mới gắn vào. Nhưng nghĩa là hành vi thật của aspect
(lấy `entityId` từ giá trị trả về) chưa từng chạy với một service thật.

Plan 05 là nơi đầu tiên chạm tới. Test đầu tiên của plan 05 nên assert audit row được ghi từ một
service thật, không chỉ assert CRUD chạy đúng.

### R-03 — Mỗi lượt ghi có audit tốn thêm một SELECT `users` (MINOR)

`AuditAspect` tra `userRepository.findByUsername(auth.getName())` mỗi lần, vì `JwtAuthFilter` đặt
principal là username chứ không phải id. Đúng như plan chỉ định, và với lưu lượng admin thì không
đáng kể. Ghi lại vì khi plan 05–10 gắn `@Audited` lên mọi thao tác ghi thì con số này nhân lên.

Giải pháp sạch hơn nếu sau này thành vấn đề: nhét `userId` vào JWT claim và đọc thẳng từ
principal, khỏi tra DB.

### R-04 — `ResponseEntity<?>` làm mất kiểu trả về của `AuthController` (MINOR)

Để nhét được `ApiError` vào nhánh 401, `login` và `refresh` bị nới từ
`ResponseEntity<TokenResponse>` thành `ResponseEntity<?>`, kèm một ép kiểu
`.<ResponseEntity<?>>map(...)` khá xấu. Hệ quả: mất kiểm tra kiểu lúc biên dịch, và sau này sinh
OpenAPI/Swagger sẽ không mô tả được response.

Cách đúng theo kiến trúc phân lớp: ném một exception có kiểu (`InvalidCredentialsException`) và
để `@RestControllerAdvice` dựng 401. Controller quay về `ResponseEntity<TokenDto>`. Đã đưa vào
plan 04b task 5.

---

## Điều làm tốt

- **Handler `AccessDeniedException` rethrow đúng như plan**, và comment giải thích *tại sao*
  (`@RestControllerAdvice` chạy trong `DispatcherServlet`, trước `ExceptionTranslationFilter`) —
  đây là chi tiết dễ bị "dọn dẹp" thành catch-all nếu không có dòng giải thích đó.
- `message` của 500 là chuỗi cố định `"Something went wrong"`, không phải `ex.getMessage()` — đúng
  yêu cầu không rò SQL/đường dẫn/username ra client.
- `requestId` trong body và trong `system_error_logs` là **cùng một UUID**, và test assert đúng
  cặp đó (`lastLog.getRequestId()).isEqualTo(error.requestId())`). Đây là thứ duy nhất nối được
  báo lỗi của người dùng với stack trace.
- `endpoint` và `exceptionClass` được cắt về 255 ký tự trước khi ghi — nếu không, chính error
  handler lại sinh ra lỗi thứ hai.
- Test dùng `@TestConfiguration` để cấp `BoomController`, không phải `@RestController` lồng trần,
  nên không rò bean sang context test khác.
- Commit body khai báo trung thực chỗ test bị yếu đi, thay vì để nó trôi qua.

---

## Kết luận

**VERDICT: NEEDS_REVISION — không ship commit này một mình.**

Code đúng plan, test có trọng lượng thật (5/5 mutation đỏ), suite ổn định qua 3 lần chạy. Nhưng
R-01 là một hồi quy hành vi thật: 404 thành 500, và bảng `system_error_logs` phình theo mỗi URL
sai. Không nên push lên `master` ở trạng thái này.

Đề nghị: giữ `a95f958` ở local, làm **plan 04b** (tái cấu trúc phân lớp, đã bao gồm task 7 sửa
R-01), rồi push cả hai cùng lúc. R-04 cũng được sửa luôn trong 04b task 5 vì nó là hệ quả của
việc thiếu tầng Facade/exception.

| Finding | Xử lý ở đâu |
|---|---|
| R-01 | plan 04b task 7 |
| R-04 | plan 04b task 5 |
| R-02 | plan 05, test đầu tiên |
| R-03 | hoãn, ghi vào STATUS |
