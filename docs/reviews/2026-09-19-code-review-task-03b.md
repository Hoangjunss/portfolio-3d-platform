# Code Review — Task 03b (auth hardening & review fixes)

**Ngày:** 2026-09-19
**Phạm vi:** working tree chưa commit, trên nền `dd8bb62`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-03b-auth-hardening-review-fixes.md`
**Review trước đó:** `docs/reviews/2026-09-19-code-review-tasks-01-03.md`

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | 7/7 PASS |
| Task 1 — default-deny security chain | **Đã làm** |
| Task 2 — refresh/logout/cleanup | **CHƯA LÀM** |
| Task 3 — user timestamps | **CHƯA LÀM** |
| Task 4 — commit & push | **CHƯA LÀM** (working tree bẩn, chưa commit) |
| Hành vi lỗi trên servlet container thật | **HỎNG** — xem R-02 |

Suite xanh nhưng **không có nghĩa là Task 1 đúng**. Xem R-02 và R-03.

---

## Phát hiện

### R-01 — Chỉ 1 trong 3 task được thực thi (chặn)

Bàn giao nói "hoàn tất viết code theo plan". Thực tế chỉ có Task 1.

Bằng chứng, đối chiếu danh sách file trong plan:

| Plan yêu cầu | Trạng thái |
|---|---|
| `RefreshTokenService.java` | không tồn tại |
| `RefreshRequest.java` | không tồn tại |
| `RefreshTokenCleanupJob.java` | không tồn tại |
| `POST /api/auth/refresh`, `POST /api/auth/logout` | không có trong `AuthController` |
| `deleteByExpiresAtBefore` trong `RefreshTokenRepository` | không có |
| Gỡ `JwtProperties.refreshSecret` | vẫn còn nguyên |
| `@EnableScheduling` | không có |
| `@PreUpdate` trong `User` | không có |
| `lastLoginAt` được set khi login | không có |

Nghĩa là **F-02, F-04, F-06, F-07 vẫn còn nguyên**. Chỉ F-03 được xử lý.

### R-02 — Default-deny làm mọi lỗi trên endpoint public biến thành 401 rỗng (chặn, lỗi mới phát sinh)

`SecurityConfig` giờ kết thúc bằng `.anyRequest().authenticated()`, nhưng đường dẫn nội bộ
`/error` không nằm trong danh sách `permitAll()`. Khi Spring gọi `response.sendError(...)`,
servlet container dispatch sang `/error`; Spring Boot `ErrorPageSecurityFilter` kiểm tra quyền
trên đường dẫn đó, thấy không được phép, và trả 401 đè lên status thật.

Kiểm chứng trên Tomcat thật (`webEnvironment = RANDOM_PORT`), **trước** khi sửa:

```
POST /api/auth/login  {"username":"","password":""}   → 401, body rỗng   (đúng ra phải là 400)
GET  /api/public/nope                                  → 401, body rỗng   (đúng ra phải là 404)
```

Hệ quả: client không phân biệt được "gửi sai dữ liệu" với "chưa đăng nhập". Màn hình login
ở plan 13 sẽ hiển thị sai thông báo. Và nó **đi ngược lại chính mục tiêu F-05** của plan 04.

**Sửa:** thêm `"/error"` vào danh sách `permitAll()`. Đã kiểm chứng cách sửa này trên Tomcat thật:

```
POST /api/auth/login  {"username":"","password":""}   → 400 {"status":400,"error":"Bad Request",...}
GET  /api/public/nope                                  → 404 {"status":404,"error":"Not Found",...}
```

`SecurityConfigTest` vẫn xanh sau khi sửa: đường dẫn chưa map bị `AuthorizationFilter` chặn ở
401 từ trước khi tới dispatcher, không đi qua `/error`.

### R-03 — Test suite không thể phát hiện R-02 (trung bình)

`SecurityConfigTest` dùng `@AutoConfigureMockMvc`. MockMvc **không chạy error dispatch của
servlet container** — nó dừng lại ở `sendError` và ghi nhận status gốc. Cùng một request mà
MockMvc báo 400 thì Tomcat thật trả 401.

Đây là lý do 7/7 xanh trong khi hành vi thật đã hỏng. Mọi kết luận về security chain rút ra từ
MockMvc đều không đáng tin.

**Sửa:** giữ `SecurityConfigTest` (MockMvc, nhanh) nhưng bổ sung ít nhất một test
`@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` khẳng định lỗi trên endpoint
public giữ đúng status. Không có nó thì R-02 sẽ quay lại mà không ai biết.

### R-04 — `/actuator/health` được mở nhưng actuator chưa có trong pom (thông tin)

`grep actuator backend/pom.xml` không ra gì. Matcher hiện là cấu hình chết.

Không phải lỗi — plan 03b yêu cầu đúng như vậy, và plan 15 (Docker healthcheck) sẽ cần nó. Ghi lại
để khi thêm `spring-boot-starter-actuator` thì nhớ rằng đường dẫn này **đã** mở sẵn, và phải kiểm
tra rằng chỉ `/actuator/health` mở chứ không phải `/actuator/**`.

### R-05 — `HttpStatusEntryPoint` là lệch so với plan, và là lệch đúng (thông tin)

Plan chỉ ghi "trả 401". Antigravity thêm:

```java
.exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
```

Cần thiết: chain này không khai báo `formLogin` hay `httpBasic`, nên entry point mặc định là
`Http403ForbiddenEntryPoint` → sẽ trả 403 chứ không phải 401. Không có dòng này thì Task 1 bước 1
không thể xanh.

Đây là lệch hợp lệ nhưng **phải ghi vào commit message** theo đúng thông lệ của `6cd2521` và
`d73d13a`. Lưu ý thêm: entry point này trả body rỗng, nên F-05 vẫn mở nguyên cho plan 04.

### R-06 — Chưa commit gì (chặn Task 4)

`git status`: `SecurityConfig.java` đã sửa nhưng chưa stage, `SecurityConfigTest.java` chưa được
track. Chưa có commit, chưa push. Task 4 của plan chưa bắt đầu.

---

## Đánh giá phần đã làm (Task 1)

Phần Task 1 làm đúng ý plan: giữ nguyên thứ tự matcher cũ, chỉ đổi catch-all, thêm
`/actuator/health` chứ không mở `/actuator/**`. Test viết trước, đúng nội dung plan mô tả.
Vấn đề duy nhất là R-02 — một hệ quả của default-deny mà bản thân plan cũng không lường trước.

**Plan 03b thiếu sót ở chỗ này, không phải lỗi thực thi.** Plan mô tả Task 1 là "đổi một dòng"
và không nhắc tới `/error`. Đã bổ sung vào phần sửa bên dưới.

---

## Kết luận về việc ship

**Chưa ship được.** Theo thứ tự chặn:

1. R-01: 2/3 task của chính plan 03b chưa làm. F-02, F-04, F-06, F-07 vẫn mở.
2. R-02: thay đổi đã làm gây ra một lỗi hành vi thật, che mọi mã lỗi trên endpoint public.
3. R-03: suite hiện tại không đủ sức phát hiện loại lỗi đó.
4. Tổng thể dự án vẫn 3/18 task tính năng — chưa có luồng nào dùng được đầu-cuối.
5. F-01 (Flyway vs entity) vẫn mở, vẫn chờ Docker.

**Việc cần làm tiếp:** hoàn tất Task 2 và Task 3 của plan 03b, kèm sửa R-02 và bổ sung test R-03,
rồi chạy Task 4.
