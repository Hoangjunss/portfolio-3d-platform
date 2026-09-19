# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `382f0e6` — **CHƯA PUSH**, đang giữ ở local có chủ đích (xem bên dưới)
**Đã push tới:** `f292ae2`
**Test:** `mvn -f backend/pom.xml test` (JDK 21.0.11) → **26/26 PASS**, ổn định qua 3 lần chạy

---

## Vì sao `a95f958` và `382f0e6` chưa push

Plan 04 và Plan 04b (tái cấu trúc layered architecture, sửa 4 vi phạm layer, sửa hồi quy 404)
đều đã hoàn thành ở local và được review cùng lúc trước khi push lên origin.

---

## Đã xong

| Plan | Nội dung | Commit |
|---|---|---|
| 01 | Scaffold Spring Boot + Flyway baseline | `d73d13a` |
| 02 | `User` entity, `Role`, `UserRepository` | `ba63aa8` |
| 03 | JWT login + security config | `6cd2521` |
| 03b | Auth hardening (4 task) | `651d46f`, `d06d235`, `ac1808c` |
| 03c | Đóng R-01…R-07 vòng 2 | `f292ae2` |
| 04 | Audit AOP + một shape lỗi cho mọi response | `a95f958` (local) |
| 04b | Layered architecture restructure (8 task) | `382f0e6` (local) |

Tiến độ: **5/19 task tính năng & refactor**. Suite 26/26 PASS.

---

## Bước kế tiếp — plan 05 (`docs/superpowers/plans/2026-09-19-05-template-crud.md`)

Plan 05 cũng đã được viết lại hôm nay (6 lỗi ngoài chuyện package — xem Revision log trong file).

**`docs/superpowers/plans/2026-09-20-04b-layered-architecture-restructure.md`**

Chuyển backend từ chia theo **feature** (`auth/`, `user/`, `audit/`, `error/`) sang chia theo
**layer** đúng skill `coding-backend-java`, nay đã được viết thành **spec section 5.1**.

**Chặn plan 05–18.** Mỗi plan sau đều tạo class mới; để càng lâu thì cuộc dọn càng lớn.

Đây không phải việc đổi tên thư mục cho đẹp. Cách chia theo feature đang **che giấu 4 vi phạm
phụ thuộc mức CRITICAL** — nằm trong cùng một package nên nhìn như gọi nội bộ:

| # | Vi phạm | Ở đâu |
|---|---|---|
| V-1 | `AuthController` inject `UserRepository` và tự kiểm mật khẩu | `auth/AuthController.java` |
| V-2 | `RefreshTokenCleanupJob` inject `RefreshTokenRepository` | `auth/RefreshTokenCleanupJob.java` |
| V-3 | `GlobalExceptionHandler` inject `SystemErrorLogRepository` | `error/GlobalExceptionHandler.java` |
| V-4 | `AuditAspect` inject `AuditLogRepository` + `UserRepository` | `audit/AuditAspect.java` |

Ngoài ra: chưa có tách interface/impl cho service, chưa có tầng converter, và
`LoginRequest`/`TokenResponse` không theo quy tắc Form-vs-Dto.

Plan 04b gồm 8 task, và deliverable quan trọng nhất là **`LayerDependencyTest`** — một test đọc
các dòng `import` và fail build nếu có class ở `controller`/`scheduler`/`aspect`/`exception` gọi
thẳng `repository`. Không có nó thì cuộc tái cấu trúc sẽ mục lại sau vài plan.

---

## Tài liệu đã cập nhật hôm nay

- **Spec mục 5.1 (mới)** — cây package bắt buộc, bảng phụ thuộc giữa các tầng, quy tắc Form vs
  Dto, quy ước hậu tố tên class, ranh giới `@Transactional`, và ghi rõ dự án dùng **constructor
  injection** (skill nói field `@Autowired` phổ biến ở repo tham chiếu của nó, nhưng chính skill
  yêu cầu theo style sẵn có của module — của ta là constructor injection, **không được "sửa lại"**).
- **Plan 05, 06, 07, 08, 09, 10, 14** — toàn bộ đường dẫn class đã đổi sang package theo layer,
  `*Request` đổi thành `*Form`, và mỗi plan được thêm ràng buộc trỏ về spec 5.1.
- **Plan 01–04 giữ nguyên** đường dẫn cũ. Chúng là hồ sơ lịch sử của những gì đã implement trước
  khi có 5.1; plan 04b là thứ dời code sang layout mới, không phải sửa ngược các plan đó.

---

## Finding còn mở

| Mã | Mức | Nội dung | Xử lý ở đâu |
|---|---|---|---|
| ~~**R-01 (p04)**~~ | MAJOR | 404 trả 500 và ghi `system_error_logs`; bot quét URL bơm bảng vô hạn | **Đã đóng** — plan 04b task 7 (`382f0e6`) |
| ~~**R-04 (p04)**~~ | MINOR | `ResponseEntity<?>` làm mất kiểu trả về của `AuthController` | **Đã đóng** — plan 04b task 5 (`382f0e6`) |
| ~~**F-05**~~ | — | Shape lỗi JSON (404 trả đúng format và không ghi error log) | **Đã đóng** — plan 04b task 7 (`382f0e6`) |
| **R-03 (p03c)** | MAJOR | `V2__refresh_token_indexes.sql` chưa từng chạy — máy không có Docker | Cần Postgres thật / Testcontainers |
| **V-02 (p03c)** | MINOR | `revoked` gộp hai nguyên nhân; refresh sau logout giết session mọi thiết bị | Cần cột `revoked_reason`, gộp với R-03 |
| R-02 (p04) | INFO | `@Audited` chưa có call site production nào | plan 05, test đầu tiên phải assert audit row |
| R-03 (p04) | MINOR | Mỗi audit row tốn thêm một SELECT `users` | Hoãn; cân nhắc nhét `userId` vào JWT claim |
| R-06 (p03b) | MINOR | Test dọn token dùng `userId(1L)` vi phạm FK thật | Thuộc F-01 |
| R-08 (p03b) | MINOR | Không giới hạn số refresh token sống mỗi user | Hoãn, gắn plan 09 |
| R-09 (p03b) | MINOR | Test job không chứng minh `@EnableScheduling` còn đó | Hoãn |
| R-10 (p03b) | INFO | H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` | Thuộc F-08 |
| F-01 | — | Migration và entity chưa từng được đối chiếu | Cần Docker. **Phải đóng trước plan 15** |
| F-08 | — | `TIMESTAMP` vs `Instant` lệch timezone | Chốt trước deploy thật |
| F-09 | — | JWT sống thêm tối đa 15 phút sau khi deactivate | Chấp nhận theo spec |

---

## Bẫy môi trường

**`JAVA_HOME` mặc định trỏ `C:\Program Files\Java\jdk1.8.0_202`.** Maven dưới JDK 8 báo
`class, interface, or enum expected` trên mọi `record` — trông như lỗi cú pháp, thực ra sai JDK.

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

**Không có Docker trên máy này** (`docker: command not found`). Mọi bước cần Postgres thật đều
treo; F-01 không đóng được.

**Suite chạy H2, Flyway tắt.** `mvn test` xanh **không** nói gì về `V1__`/`V2__`.

---

## Tình trạng công cụ

**Antigravity dùng tốt.** Lượt plan 04 làm đủ cả task verify (mutation check) lẫn commit — khác
lượt 03c vốn bỏ qua hai bước cuối. Kết quả mutation Antigravity tự báo đã được Claude chạy lại
độc lập và **khớp từng dòng**, kể cả thông điệp lỗi.

Vẫn nên kiểm lại bước verify cuối mỗi lượt thay vì mặc định là đã xong — hai lượt vừa rồi cho hai
kết quả khác nhau.
