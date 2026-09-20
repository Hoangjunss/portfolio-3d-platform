# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `ea8e7de` — plan 08 xong cả hai task, **đã push**
**Test:** `mvn -f backend/pom.xml clean test` (JDK 21.0.11) → **92/92 PASS**

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
| 04b | Layered architecture restructure (8 task) | `382f0e6` |
| 06 | Content sections + media upload + settings | `e99ae9e` |
| 07 task 1 | Đóng C-01/C-02/C-03 + lỗi giới hạn multipart | `c7a3a0d` |
| 07 task 2 | Lead capture + notification email (best-effort) | `fa7b824`, `0fbf9f1` |
| 08 task 1 | 4xx cho request body hỏng thay vì 500 + log row | `d04bf9d` |
| 08 task 2 | Analytics ingest + summary, HMAC IP, đóng T-02 | `6837c5e`, `ea8e7de` |

Tiến độ: **9/19 task tính năng & refactor**. Suite 92/92 PASS.

---

## Bước kế tiếp — plan 09 (rate limiting)

**`docs/superpowers/plans/2026-09-19-09-rate-limiting.md`** — **CẦN RÀ LẠI TRƯỚC KHI GIAO.**

Plan 09 phải gánh ba thứ mang sang:

- **L-01 nửa sau (plan 07 task 2)** — đẩy việc gửi mail lead ra sau commit
  (`@TransactionalEventListener(AFTER_COMMIT)` hoặc `@Async`) để DB connection không phải chờ
  mạng. Nửa đầu (timeout 5s) đã vá ở `0fbf9f1`.
- **P-03 (plan 08 task 1)** — response 405 chưa kèm header `Allow`.
- **Cảnh báo từ quyết định (h) của plan 08**: `PublicAnalyticsController.resolveClientIp` đọc
  `X-Forwarded-For`, mà client giả được header đó. **Rate limiting tuyệt đối không được tái sử
  dụng phương thức đó để định danh client** — ai cũng vượt được giới hạn bằng cách đổi header.
  Trước khi có nginx (plan 16) đặt `X-Forwarded-For` một cách đáng tin, rate limit phải dựa trên
  `getRemoteAddr()`.

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
| A-04 (p04b) | INFO | `LayerDependencyTest` mù với tham chiếu fully-qualified | ArchUnit nếu dự án chịu thêm dependency |
| A-05 (p04b) | INFO | `RotationDto` mang entity `User` nên `dto` phụ thuộc `model` | Cân nhắc khi chạm lần sau |
| ~~**T-02 (p05)**~~ | MINOR | `view_count` có trong schema, entity và `TemplateDto` nhưng không code nào ghi | **Đã đóng** — `6837c5e`, `PAGE_VIEW` tăng `view_count`, M7 đỏ |
| ~~**C-01 (p06)**~~ | MAJOR | Upload bị từ chối → 500 + ghi `system_error_logs`; EDITOR bơm được bảng | **Đã đóng** — `c7a3a0d`, M3 đỏ |
| ~~**C-02 (p06)**~~ | MAJOR | Test sniffed-type không canh giá trị `mime_type` lưu xuống | **Đã đóng** — `c7a3a0d`, M1 đỏ |
| ~~C-03 (p06)~~ | MINOR | `in.read(header)` có thể đọc thiếu → WEBP hợp lệ bị từ chối | **Đã đóng** — `c7a3a0d`, M2 đỏ |
| **A-08 (p08t2)** | MAJOR khi deploy | `analytics.ip-hash-secret` và `jwt.access-secret` đều có default nằm công khai trong repo, không gì fail nếu env không đặt | **Plan 15 phải bắt buộc env thật, fail startup nếu còn giá trị dev** |
| A-09 (p08t2) | INFO | `/api/admin/analytics/summary` không cache, 3 query mỗi lần gọi | Plan 14 — cache TTL ngắn |
| A-10 (p08t2) | INFO | `existsById` bỏ qua soft-delete của `TemplateService` | Ghi nhận |
| A-11 (p08t2) | — | `V3__analytics_indexes.sql` chưa từng chạy thật | Gia nhập R-03/F-01 |
| **P-01 (p08t1)** | — | Lưới `ErrorResponse` không phủ malformed-body và type-mismatch; hai handler riêng là load-bearing | **Đã ghi comment** (`d04bf9d`) |
| P-03 (p08t1) | MINOR | Response 405 không kèm header `Allow` | Plan 09 |
| P-04 (p08t1) | INFO | Import thừa trong `GlobalExceptionHandlerTest` | Dọn khi chạm lại |
| **L-01 (p07t2)** | MAJOR | Mail gửi đồng bộ trong `@Transactional`; JavaMail không timeout mặc định → SMTP treo giữ luôn DB connection. **Nửa đầu đã vá** (`0fbf9f1`, timeout 5s) | Nửa sau — gửi sau commit — **plan 09**, cùng chỗ rate limiting |
| L-02 (p07t2) | MINOR | `lead.setStatus(NEW)` không test nào canh được (entity có field initializer); M5 xanh | Ghi nhận |
| L-03 (p07t2) | MINOR | Test audit row lấy `findAll().get(size-1)`, phụ thuộc thứ tự và `audit_logs` không được dọn | Plan 14 khi chạm lại: lọc theo `entityType` |
| L-05 (p07t2) | INFO | Tên/nội dung lead đi thẳng vào email; JavaMail có mã hoá nên chưa phải lỗ hổng sống | Cùng nhóm C-04 |
| ~~**D-02 (p07t1)**~~ | MINOR | `spring.servlet.multipart.max-file-size` và `media.max-size-bytes` phải đi cặp, không gì canh; nâng một cái mà quên cái kia là lỗi 500 + log row quay lại | **Đã đóng** — `MultipartLimitTest` trong `fa7b824` |
| D-03 (p07t1) | INFO | Tomcat `max-swallow-size` mặc định 2MB có thể làm client thấy connection reset thay vì 413 | Plan 15/16 — kiểm bằng `curl` thật |
| D-04 (p07t1) | INFO | `InvalidRequestException` echo `ex.getMessage()`; giờ là loại dùng chung toàn dự án | Quy ước: không nhét input người gửi vào message |
| C-04 (p06) | MINOR | `media.file_name` là tên do người gửi đặt, trả ra `MediaDto` | Plan 14 phải escape |
| T-03 (p05) | INFO | Handler 404 trả `ex.getMessage()`; chỉ an toàn vì exception là của ta | Ghi nhận |
| T-05 (p05) | INFO | `config` và `filter` miễn trắng khỏi allow-list | Siết lại nếu `config/` phình |
| R-03 (p04) | MINOR | Mỗi audit row tốn thêm một SELECT `users` | Hoãn; cân nhắc nhét `userId` vào JWT claim |
| R-06 (p03b) | MINOR | Test dọn token dùng `userId(1L)` vi phạm FK thật | Thuộc F-01 |
| R-08 (p03b) | MINOR | Không giới hạn số refresh token sống mỗi user | Hoãn, gắn plan 09 |
| R-09 (p03b) | MINOR | Test job không chứng minh `@EnableScheduling` còn đó | Hoãn |
| R-10 (p03b) | INFO | H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` | Thuộc F-08 |
| F-01 | — | Migration và entity chưa từng được đối chiếu | Cần Docker. **Phải đóng trước plan 15** |
| F-08 | — | `TIMESTAMP` vs `Instant` lệch timezone | Chốt trước deploy thật |
| F-09 | — | JWT sống thêm tối đa 15 phút sau khi deactivate | Chấp nhận theo spec |
| **M-01 (p06)** | INFO | Đường dẫn `/media/<name>` chưa có endpoint/static resource mapping | Plan 16 (nginx) quản lý phục vụ path này; phải phục vụ với `Content-Disposition: attachment` hoặc từ origin riêng nếu allow-list mở rộng |

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

**Antigravity: chất lượng tốt, nhưng độ bao phủ mỗi lượt thì không đoán trước được.**

| Lượt | Kết quả |
|---|---|
| 03c | Làm 6/7 task, **bỏ mutation check và commit**, không báo |
| 04 | Làm đủ, có mutation check, có commit, khai báo trung thực chỗ test bị yếu đi |
| 04b lần 1 | **Chỉ làm task 1/8**, vẫn báo "hoàn tất" |
| 04b lần 2 | Làm đủ task 2–8, commit body khớp từng điểm khi kiểm lại |
| 07 lần 1 | **0/16 step.** Vẫn báo "hoàn tất". Cây làm việc sạch, không commit mới, không một file nào được tạo: không có `InvalidRequestException`, không có file `*Lead*` hay `*Notification*` nào. `mvn clean test` sau đó: 58/58 PASS — đúng baseline cũ, không thêm test nào |
| 08 lần 2 | **8/8 step của task 2**, kể cả commit. Commit body khai cả bảy mutation kèm thông điệp lỗi thật của từng cái; hai cái tôi kiểm lại đều khớp. Lượt đầy đủ thứ hai |
| 08 lần 1 | **6/14 step.** Task 1 làm tốt (test cuối đánh thẳng vào `/api/public/leads` thật, không phải endpoint giả), nhưng **lại bỏ bước commit** — lần thứ ba liên tiếp — và không có dấu vết chạy mutation check. Task 2 không động tới |
| 07 lần 3 | **8/8 step của task 2**, kể cả commit. Lượt đầy đủ đầu tiên của plan 07. Đáng ghi nhận: **tự báo M5 XANH** — kiểm lại đúng là xanh. Lần đầu nó khai một mutation không bị bắt thay vì báo cáo đẹp hơn thực tế |
| 07 lần 2 | **8/16 step.** Task 1 xong và làm tốt (mutation M1–M4 tôi tự chạy đều đỏ), nhưng **bỏ đúng bước commit** như lượt 03c, và Task 2 không động tới. Vẫn báo "hoàn tất". Thêm một `@WithMockUser` thừa vào test cũ — loại thay đổi không làm suite đỏ nên không gì tự báo, phải `git diff` cả file cũ mới thấy |

Kết luận vận hành: **luôn tự kiểm xem plan đã chạy hết chưa**, đừng tin tin báo "hoàn tất". Cách
rẻ nhất là `ls` các package/file mà plan yêu cầu tạo, rồi đếm test. Và luôn tự chạy lại mutation
check — hai lần Antigravity tự báo đều đúng, nhưng đó không phải lý do để bỏ kiểm.
