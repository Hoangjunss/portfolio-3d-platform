# Code Review — Plan 07 Task 2 (lead + notification)

**Ngày:** 2026-09-20
**Phạm vi:** commit `fa7b824`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-07-lead-notification.md`, Task 2
**Người viết code:** Antigravity (lượt 3) — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 2, step 1–8 | **Xong cả tám**, kể cả commit |
| 13 file plan yêu cầu + `MultipartLimitTest` (quyết định (h)) | **Đủ 14** |
| Không đụng `SecurityConfig`, không viết migration mới | Đúng |
| Không sửa file test có sẵn | Đúng — `git show --stat` chỉ toàn file mới |
| `mvn -f backend/pom.xml clean test` (JDK 21.0.11) | **73/73 PASS** |
| Số test trước / sau | 63 → 73 (+10) |
| `LayerDependencyTest` | Xanh |

Lượt đầy đủ đầu tiên của plan 07. Ba lượt trước: 0/16, rồi 8/16, giờ 8/8.

### Mutation check

Antigravity báo cả 7. Tôi tự kiểm lại hai cái đáng ngờ nhất — cái nó khai là XANH và cái nó
khai có hành vi bất thường.

| # | Revert gì | Nó báo | Tôi kiểm lại |
|---|---|---|---|
| M5 | bỏ `lead.setStatus(LeadStatus.NEW)` | XANH | **Đúng — XANH.** `LeadServiceTest` 3/3 + `PublicLeadControllerTest` 4/4 vẫn xanh khi xoá dòng đó |
| M11 | bỏ `@Size(max = 255)` khỏi `name` | ĐỎ, 500 thay vì 400 | **Đúng — ĐỎ.** `Status expected:<400> but was:<500>` |
| M6–M10 | — | ĐỎ | Không chạy lại; M5 và M11 khớp nên tin phần còn lại ở mức này |

**Đây là lần đầu Antigravity tự báo một kết quả bất lợi mà kiểm lại thì đúng.** M5 xanh là
thông tin có giá trị, và nó không giấu.

Ghi chú về M11: nó đỏ **vì H2 ở MODE=PostgreSQL có siết độ dài cột**, không phải vì
Bean Validation. Tức là nếu không có `@Size`, tên 300 ký tự đi thẳng xuống DB và bật lên thành
`DataIntegrityViolationException` → 500 + một dòng `system_error_logs`, **từ một endpoint công
khai không cần đăng nhập**. Đúng y hệt kịch bản quyết định (e) dự đoán. `@Size` có sức nặng thật.

---

## Phát hiện

### L-01 — Mail gửi đồng bộ trong transaction, và JavaMail không có timeout mặc định (MAJOR — **đã vá nửa đầu ở `0fbf9f1`**)

`LeadServiceImpl.submit` có `@Transactional`, và `notificationService.notifyNewLead(saved)` nằm
**bên trong** nó. Quyết định (d) lo đúng một chuyện: SMTP chết thì không được mất lead — và
`catch (MailException)` giải quyết chuyện đó. Nhưng còn chuyện thứ hai không ai lo:

`spring.mail` trước commit này **không đặt timeout nào**, mà JavaMail mặc định là **vô hạn**.
Một SMTP host nhận kết nối rồi im lặng (không phải chết hẳn — chết hẳn thì `ConnectException`
về ngay) sẽ giữ:

1. request thread của Tomcat, và
2. **DB connection** của transaction đang mở.

`POST /api/public/leads` là endpoint công khai, **chưa có rate limit** (Bucket4j là plan 09).
Hikari mặc định 10 connection. Mười lần submit vào một SMTP treo là cạn pool — và lúc đó không
chỉ lead chết, mà **mọi endpoint chạm DB đều chết**.

Đã vá **nửa đầu** ở `0fbf9f1`: `connectiontimeout` / `timeout` / `writetimeout` = 5000ms. Giờ
xấu nhất là mỗi request treo 5 giây thay vì vĩnh viễn.

**Nửa còn lại chưa làm:** đẩy việc gửi mail ra ngoài transaction —
`@TransactionalEventListener(phase = AFTER_COMMIT)` hoặc `@Async` — để DB connection được trả
lại ngay khi commit xong, không phải chờ mạng. Gắn vào **plan 09**, cùng chỗ với rate limiting
cho đúng endpoint này; hai biện pháp bảo vệ cùng một bề mặt tấn công thì nên đi chung.

### L-02 — `lead.setStatus(LeadStatus.NEW)` không có test nào canh được (MINOR, đã kiểm chứng)

M5 xanh vì `Lead.status` có field initializer `= LeadStatus.NEW`. Xoá dòng trong service, entity
vẫn tự đặt, mọi assertion vẫn đúng.

Không phải lỗi — hai chỗ cùng đặt một giá trị là defence in depth thật, và bỏ đi thì có ngày
ai đó xoá field initializer rồi lead ra đời với `status = null` vi phạm `NOT NULL`. Nhưng phải
gọi đúng tên: **assertion `assertThat(...getStatus()).isEqualTo(NEW)` trong hai test không
chứng minh gì về code của service**, nó chỉ chứng minh entity có default.

Nếu muốn canh thật thì test `new Lead().getStatus()` trực tiếp — nó nói rõ ràng hơn rằng default
nằm ở entity. Còn để nguyên cũng được, miễn là đừng tưởng hai test kia đang canh service.

### L-03 — Test audit row phụ thuộc thứ tự `findAll()` (MINOR)

```java
List<AuditLog> auditLogs = auditLogRepository.findAll();
AuditLog auditLog = auditLogs.get(auditLogs.size() - 1);
assertThat(auditLog.getEntityType()).isEqualTo("Lead");
```

`@BeforeEach` chỉ `leadRepository.deleteAll()`, **không dọn `audit_logs`**. Các test class khác
dùng chung context và chung H2 in-memory, nên bảng đó đã có sẵn row của `Media`, `Template`,
`ContentSection`. Test này đang đặt cược rằng `findAll()` trả về đúng thứ tự chèn và không có
gì chèn xen vào sau.

Hiện xanh, nhưng đổi thứ tự chạy test là hỏng. `MediaControllerTest` đã làm đúng cách từ trước:

```java
auditLogRepository.findAll().stream()
        .filter(log -> "Media".equals(log.getEntityType()))
        .reduce((first, second) -> second)
```

Nên lọc theo `entityType` giống vậy.

### L-04 — Plan của tôi ghi sai cú pháp lệnh test (MINOR, lỗi quy trình — **đã sửa**)

Plan 07 (và các plan khác) ghi `mvn test -Dtest='LeadServiceTest+NotificationServiceTest'`.
Surefire ngăn cách bằng **dấu phẩy**, không phải `+`. Lệnh sai không báo lỗi cú pháp mà báo:

```
No tests matching pattern "LeadServiceTest+PublicLeadControllerTest" were executed!
```

và **thoát với exit code 1** trong khi không chạy một test nào. Tôi tự vấp đúng cái này khi chạy
mutation M5: exit 1, rồi grep phải báo cáo surefire **cũ còn sót** và suýt kết luận sai.

Đây là loại lỗi nguy hiểm vì nó trông giống "test đỏ". Đã sửa toàn bộ plan sang dấu phẩy, và từ
giờ mọi mutation check phải `rm -f backend/target/surefire-reports/*.txt` trước khi chạy.

### L-05 — Tên và nội dung lead đi thẳng vào email (INFO)

`message.setSubject("New lead: " + lead.getName())` và phần thân chứa nguyên `message` của người
gửi. `MimeMessage.setSubject` của JavaMail có mã hoá RFC 2047 nên đây **không** phải lỗ hổng
header injection đang sống. Ghi lại cùng nhóm với C-04: `leads.name` / `leads.message` là dữ liệu
không tin được, bất kể nó được render ở đâu — email, trang admin plan 14, hay export sau này.

---

## Điều làm tốt

- **Tự báo M5 XANH.** Đây là điều đáng ghi nhận nhất của lượt này. Ba lượt trước vấn đề luôn là
  báo cáo đẹp hơn thực tế; lần này nó khai một mutation không bị bắt, và kiểm lại thì đúng.
- **Quyết định (h) được làm dù nó không nằm trong danh sách file gốc của task**, và
  `MultipartLimitTest` viết đúng ý: đọc cả hai property, assert quan hệ giữa chúng.
- **Thêm một test không có trong plan** — `submit_withValidSourceTemplateId_savesAndNotifies`.
  Nó phủ nhánh `existsById` trả `true`, thứ mà hai test kia bỏ trống. Thêm đúng chỗ.
- **`verifyNoInteractions(templateRepository)`** ở ca `sourceTemplateId == null`: canh đúng rằng
  không có query thừa cho trường hợp phổ biến nhất.
- Controller test dùng `@MockBean NotificationService` nên không test nào mở socket SMTP thật.
- Comment đều là WHY, không có comment mô tả lại code.

---

## Kết luận

**VERDICT: PASS — `fa7b824` + `0fbf9f1`.**

Plan 07 xong cả hai task. 73/73, +10 test, và hai mutation tôi tự kiểm đều khớp báo cáo. L-01 là
MAJOR nhưng nửa nguy hiểm nhất (treo vô hạn) đã vá ngay; nửa còn lại là tối ưu kiến trúc, không
phải lỗ hổng, và có chỗ đúng để làm là plan 09.

| Finding | Xử lý |
|---|---|
| L-01 | Nửa đầu **đã vá** (`0fbf9f1`). Nửa sau — gửi mail sau commit — **plan 09**, cùng chỗ rate limiting |
| L-02 | Ghi nhận; đừng tưởng hai test kia đang canh service |
| L-03 | Plan 14 khi chạm lại `PublicLeadControllerTest`: lọc theo `entityType` |
| L-04 | **Đã sửa** toàn bộ plan sang dấu phẩy |
| L-05 | Ghi nhận cùng C-04 — dữ liệu không tin được |
