# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `f21dfaf` — **đã push**
**Test:** `mvn -f backend/pom.xml test` (JDK 21.0.11) → **26/26 PASS**, ổn định qua 3 lần chạy

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

## Bước kế tiếp — plan 05 (Template CRUD)

**`docs/superpowers/plans/2026-09-19-05-template-crud.md`** — đã viết lại hoàn toàn hôm nay.

**Trước khi bắt đầu plan 05, phải làm A-01:** `LayerDependencyTest` hiện mới phủ 2 trong 8 luật
phụ thuộc. Nó bắt đúng bốn vi phạm đang có, nhưng **chưa** bắt được Service → Facade,
Converter → Service, Converter → Repository, Helper → Service — đều là NEVER ALLOWED theo skill.
Plan 06–18 mỗi plan đều thêm service và converter mới; test này là thứ duy nhất ngăn chúng đi sai.
Chi tiết trong `docs/reviews/2026-09-20-code-review-plan-04b.md`.

Plan 05 đã sửa 6 lỗi ngoài chuyện package (xem Revision log trong file), đáng chú ý:
`AdminTemplateController.create` nhận `Authentication` rồi truyền `null` làm `createdBy` khiến
`created_by` null vĩnh viễn; và `incrementClickCount` đọc-sửa-ghi nên mất lượt khi hai click đồng
thời, trong khi plan 08 gọi nó từ endpoint công khai.

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
| **A-01 (p04b)** | MAJOR | `LayerDependencyTest` mới phủ 2/8 luật; chưa bắt Service→Facade, Converter→Service, Converter→Repository, Helper→Service | **Làm trước plan 05** |
| **A-02 (p04b)** | MINOR | `AuthServiceFacadeImpl.login` còn giữ quyết định nghiệp vụ; nên gộp vào `UserService.authenticate` | plan 05 hoặc lần sau chạm `UserService` |
| A-03 (p04b) | NIT | Comment "token-validity oracle" nhân đôi ở controller và facade | Bỏ bản ở controller |
| A-04 (p04b) | INFO | `LayerDependencyTest` mù với tham chiếu fully-qualified | ArchUnit nếu dự án chịu thêm dependency |
| A-05 (p04b) | INFO | `RotationDto` mang entity `User` nên `dto` phụ thuộc `model` | Cân nhắc khi chạm lần sau |
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

**Antigravity: chất lượng tốt, nhưng độ bao phủ mỗi lượt thì không đoán trước được.**

| Lượt | Kết quả |
|---|---|
| 03c | Làm 6/7 task, **bỏ mutation check và commit**, không báo |
| 04 | Làm đủ, có mutation check, có commit, khai báo trung thực chỗ test bị yếu đi |
| 04b lần 1 | **Chỉ làm task 1/8**, vẫn báo "hoàn tất" |
| 04b lần 2 | Làm đủ task 2–8, commit body khớp từng điểm khi kiểm lại |

Kết luận vận hành: **luôn tự kiểm xem plan đã chạy hết chưa**, đừng tin tin báo "hoàn tất". Cách
rẻ nhất là `ls` các package/file mà plan yêu cầu tạo, rồi đếm test. Và luôn tự chạy lại mutation
check — hai lần Antigravity tự báo đều đúng, nhưng đó không phải lý do để bỏ kiểm.
