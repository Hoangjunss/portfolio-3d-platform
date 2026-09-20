# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `e99ae9e` — **CHƯA PUSH** (xem C-01 bên dưới)
**Đã push tới:** `7191248`
**Test:** `mvn -f backend/pom.xml test` (JDK 21.0.11) → **58/58 PASS**, ổn định qua 3 lần chạy

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

## Vì sao `e99ae9e` chưa push

Plan 06 làm tốt phần khó (lưu file chống traversal + chống stored XSS), nhưng review ra hai lỗi
MAJOR — chi tiết trong `docs/reviews/2026-09-20-code-review-plan-06.md`:

- **C-01** — upload bị từ chối trả **500** và ghi một dòng `system_error_logs`. Đã kiểm chứng
  bằng probe chạy thật: `PROBE_STATUS=500`, `PROBE_ERRORLOG_DELTA=1`. Người có role EDITOR bơm
  được bảng đó tuỳ ý. Cùng dạng với R-01 (404→500) đã vá ở plan 04b — khuôn mẫu đang lặp: thêm
  exception mới mà quên handler, catch-all nuốt hết.
- **C-02** — `store_withSpoofedContentType_usesSniffedType` không canh điều tên nó hứa. Đổi
  `setMimeType(detectedMimeType)` thành `setMimeType(file.getContentType())` mà suite **vẫn
  xanh**. Ca chưa phủ: PNG thật khai `Content-Type: text/html`.

---

## Bước kế tiếp — plan 07 (lead + notification) — ĐÃ RÀ XONG, ĐANG GIAO

**`docs/superpowers/plans/2026-09-19-07-lead-notification.md`** — **đã viết lại 2026-09-20**,
đang giao cho Antigravity. Bản cũ còn `package com.portfolio.platform.lead;` từ trước spec 5.1 ở
mọi code block và không gánh finding nào của plan 06.

Bản mới có **2 task**:

- **Task 1 — đóng C-01/C-02/C-03** (commit riêng): thêm `exception/InvalidRequestException` +
  handler 400 không ghi log row; test tầng controller assert cả status lẫn `system_error_logs`
  count; ca PNG thật khai `text/html` assert giá trị `mime_type` lưu xuống; `readNBytes(12)` kèm
  một `MultipartFile` giả trả 4 byte mỗi lần đọc (vì `MockMultipartFile` không bao giờ đọc thiếu).
- **Task 2 — lead + notification**: đủ cây package 5.1, `PublicLeadController`, mail best-effort.

Ba quyết định lệch/thêm so với review, đã ghi lý do trong plan:

- **(b)** `SecurityException` traversal **giữ nguyên 500**, không đổi thành 400 như review đề
  xuất — tên file lưu suy từ UUID nên không input nào của caller chạm tới `target`; nếu nhánh đó
  nổ thì là sai cấu hình `media.upload-dir`, đúng loại đáng ghi `system_error_logs`.
- **(c) Lỗi mới tìm ra khi rà plan**: `application.yml` đặt `media.max-size-bytes: 10485760`
  nhưng không đặt `spring.servlet.multipart.max-file-size` — mặc định Boot là **1MB**. Nên hôm
  nay check 10MB của `MediaServiceImpl` là code chết, và một file PNG 2MB chết ở tầng parse
  multipart → **500 + một dòng `system_error_logs`**. Đúng dạng C-01, đang sống. Plan sửa cả hai
  nửa: nâng giới hạn multipart cho khớp, và thêm handler trả 413.
- **(e)/(f)** `LeadCreateForm` phải có `@Size` khớp độ dài cột, và `sourceTemplateId` phải kiểm
  `existsById` — nếu không thì cả hai đều thành 500 + log row **từ endpoint công khai không cần
  đăng nhập**, tức là tệ hơn C-01.

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
| **T-02 (p05)** | MINOR | `view_count` có trong schema, entity và `TemplateDto` nhưng không code nào ghi — FE plan 12 sẽ vẽ số 0 vĩnh viễn | **Plan 08 phải quyết**: wire hoặc bỏ khỏi DTO |
| **C-01 (p06)** | MAJOR | Upload bị từ chối → 500 + ghi `system_error_logs`; EDITOR bơm được bảng | plan 07 task 1 |
| **C-02 (p06)** | MAJOR | Test sniffed-type không canh giá trị `mime_type` lưu xuống | plan 07 task 1 |
| C-03 (p06) | MINOR | `in.read(header)` có thể đọc thiếu → WEBP hợp lệ bị từ chối | plan 07 task 1 |
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

Kết luận vận hành: **luôn tự kiểm xem plan đã chạy hết chưa**, đừng tin tin báo "hoàn tất". Cách
rẻ nhất là `ls` các package/file mà plan yêu cầu tạo, rồi đếm test. Và luôn tự chạy lại mutation
check — hai lần Antigravity tự báo đều đúng, nhưng đó không phải lý do để bỏ kiểm.
