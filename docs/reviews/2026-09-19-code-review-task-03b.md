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

---

## Vòng 2 — 2026-09-19, sau lượt bàn giao thứ hai

**Phạm vi:** commit `651d46f`.

### Đã đóng

| Mã | Nội dung | Kiểm chứng |
|---|---|---|
| R-02 | `"/error"` đã được thêm vào `permitAll()` | Trên Tomcat thật: validation trên `/api/auth/login` trả 400, `/api/public/nope` trả 404 |
| R-03 | `ErrorDispatchSecurityTest` dùng `RANDOM_PORT` + `TestRestTemplate` | 2/2 xanh; và **2/2 đỏ khi gỡ `"/error"`** — test có sức nặng thật, không phải test rỗng |
| R-05 | Hai điểm lệch so với plan | Đã ghi vào commit body của `651d46f` |
| R-06 | Công việc Task 1 chưa commit | Đã commit và push |

`mvn -f backend/pom.xml test` (JDK 21.0.11): **9/9 PASS**.

### Còn mở

**R-01 vẫn nguyên.** Lượt bàn giao thứ hai làm mục (1) và (2), bỏ mục (3) và (4) — đúng kiểu
lượt đầu tiên: phần đầu của yêu cầu được làm, phần sau bị bỏ.

Kiểm lại từng dấu hiệu:

| Plan 03b yêu cầu | Trạng thái |
|---|---|
| `RefreshTokenService` / `RefreshRequest` / `RefreshTokenCleanupJob` | vẫn không tồn tại |
| `POST /api/auth/refresh`, `POST /api/auth/logout` | vẫn không có |
| `deleteByExpiresAtBefore` | vẫn không có |
| `JwtProperties.refreshSecret` + khoá `jwt.refresh-secret` | vẫn còn nguyên cả hai |
| `@EnableScheduling` | vẫn không có |
| `@PreUpdate` trong `User` | vẫn không có |
| `lastLoginAt` được set khi login | vẫn không có |

Nghĩa là **F-02, F-04, F-06, F-07 vẫn mở** sau hai lượt. Task 2 và Task 3 của plan 03b chưa
được động tới dòng nào.

### Nhận xét về cách chia việc

Hai lượt liên tiếp đều dừng lại sau phần đầu của yêu cầu. Bàn giao lần sau nên tách nhỏ: **một
lượt chỉ làm Task 2, một lượt chỉ làm Task 3**, thay vì gộp bốn mục vào một yêu cầu. Việc xác
nhận "đã hoàn tất" từ phía công cụ thực thi không đáng tin, phải kiểm bằng sự tồn tại của file
và bằng test.

### Kết luận về việc ship

**Vẫn chưa ship được.** Task 1 giờ đã vững và có test bảo vệ, nhưng lý do chặn không đổi: 2/3
task của plan 03b chưa làm, F-02/F-04/F-06/F-07 còn mở, và tổng thể dự án vẫn 3/18 task tính năng.

---

## Vòng 3 — 2026-09-19, plan 03b hoàn tất

**Phạm vi:** commit `d06d235` (Task 2) và `ac1808c` (Task 3).

**Lưu ý về độ tin cậy của vòng này:** Antigravity hết quota (HTTP 429, reset sau ~165h) nên
không thể bàn giao. Người dùng cho phép tự implement. Code vòng này do chính bên review viết,
nên mục dưới đây là **tự kiểm, không phải review độc lập**. Cần một lượt review độc lập trước
khi plan 04 bắt đầu.

### R-01 — đã đóng

| Plan 03b yêu cầu | Trạng thái |
|---|---|
| `RefreshTokenService` / `RefreshRequest` / `RefreshTokenCleanupJob` | đã tạo |
| `POST /api/auth/refresh`, `POST /api/auth/logout` | đã có |
| `deleteByExpiresAtBefore` | đã có (`@Modifying` + `@Transactional`) |
| `JwtProperties.refreshSecret` + khoá `jwt.refresh-secret` | đã gỡ cả hai |
| `@EnableScheduling` | đã có |
| `@PreUpdate` trong `User` | đã có |
| `lastLoginAt` được set khi login | đã có |

F-02, F-04, F-06, F-07 đóng. `mvn -f backend/pom.xml test` (JDK 21.0.11): **16/16 PASS**.

### Sức nặng của test

4 test mới của Task 2 đã được chạy **trước** khi implement: cả 4 đỏ với 404 (không phải đỏ do
lỗi biên dịch — `RefreshRequest` được tạo trước để phần đỏ có nghĩa). 2 test mới của Task 3 cũng
chạy đỏ trước khi sửa `User` và `AuthController`. Đây là điều R-03 vòng 1 đòi hỏi.

`RefreshTokenCleanupJobTest` khẳng định row hết hạn bị xoá còn row **đã revoke nhưng chưa hết
hạn** thì ở lại — đúng thứ làm cho kiểm tra replay ở Step 5 hoạt động.

### Điểm cần người review độc lập soi kỹ

1. `RefreshTokenService.rotate()` lệch plan: trả `Rotation(User, String)` thay vì user id trần,
   để giữ đúng thứ tự "kiểm `isActive` trước khi revoke" trong một transaction. Đã ghi vào commit
   body của `d06d235`, nhưng cần xác nhận đây là lệch đúng.
2. Hai endpoint mới trả 401/204 với body rỗng. F-05 vẫn mở — plan 04 phải phủ cả 401 của
   `/refresh`, không chỉ 5xx.
3. Chưa có test cho nhánh "user bị deactivate thì không refresh được" (Step 5 rule 3). Logic có
   trong code nhưng không có test bảo vệ. **Nên bổ sung** trước khi plan 10 dựa vào nó.
4. `RefreshTokenCleanupJob` là `@Profile("!test")`, nên không có gì kiểm chứng rằng cron thật sự
   được đăng ký khi chạy production. `@EnableScheduling` có mặt, nhưng đó là suy luận chứ không
   phải kiểm chứng.

### Môi trường

`JAVA_HOME` mặc định của máy trỏ `C:\Program Files\Java\jdk1.8.0_202`; Maven chạy với JDK 8 sẽ
báo "class, interface, or enum expected" trên mọi `record`. Phải export
`C:/Program Files/Java/jdk-21.0.11` trước khi build. Ghi lại để lượt sau không mất thời gian.

### Kết luận về việc ship

Plan 03b **đã hoàn tất cả 4 task**. Các finding chặn của review tasks 01–03 đã đóng, trừ F-01
(chờ Docker), F-05 (thuộc plan 04), F-08 và F-09 (ngoài phạm vi, đã ghi rõ).

Vẫn **chưa ship được sản phẩm**: dự án ở mức 3/18 task tính năng, chưa có luồng nào dùng được
đầu-cuối. Bước kế tiếp theo đúng thứ tự là `2026-09-19-04-audit-error-logging.md`.
