# Code Review — Plan 08 Task 2 (analytics + đóng T-02)

**Ngày:** 2026-09-20
**Phạm vi:** commit `6837c5e`, siết thêm ở `ea8e7de`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-08-analytics.md`, Task 2
**Người viết code:** Antigravity (lượt 5) — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 2, step 1–8 | **Xong cả tám**, kể cả commit |
| 17 file plan liệt kê + `V3__analytics_indexes.sql` | **Đủ** |
| Bảy quyết định (c)–(j) | Làm đủ cả bảy |
| Không đụng `SecurityConfig`, không tạo bảng mới | Đúng |
| `mvn -f backend/pom.xml clean test` | **92/92 PASS** |
| Số test trước / sau | 79 → 92 (+13) |

Lượt đầy đủ thứ hai. Commit body khai cả bảy mutation kèm thông điệp lỗi cụ thể của từng cái —
chi tiết tới mức kiểm lại được, không phải "RED as expected" suông.

### Mutation check

| # | Nó báo | Tôi kiểm lại |
|---|---|---|
| M5 — bỏ secret khỏi HMAC | ĐỎ, kèm hash cụ thể | **Đúng — ĐỎ.** Ép `secret` thành hằng, `AnalyticsServiceTest` 7 test → 1 failure |
| M7 — `PAGE_VIEW` cũng tăng click_count | ĐỎ | **Đúng — ĐỎ** |
| M4, M6, M8, M9, M10 | ĐỎ | Không chạy lại; hai cái trên khớp nên tin phần còn lại ở mức này |

M5 là cái plan cảnh báo dễ thành trang trí nhất — test phải chứng minh **đổi secret thì đổi
hash**, chứ không chỉ "hash khác IP thô". Test viết đúng kiểu đó và mutation đỏ thật.

T-02 đóng có dây thật: `TemplateRepository.incrementViewCount` → `TemplateService` → gọi trong
nhánh `PAGE_VIEW`, và M7 chứng minh nhánh không bị lẫn với `TEMPLATE_CLICK`.

---

## Phát hiện

### A-06 — Allow-list kiến trúc bị nới rộng hơn nhu cầu (MINOR — **đã sửa ở `ea8e7de`**)

`LayerDependencyTest` được nới ba chỗ:

| Nới gì | Có người dùng thật không? |
|---|---|
| `repository` → `dto` | **Có.** `AnalyticsEventRepository` dùng JPQL constructor expression trả `TemplateClickCountDto` |
| `form` → `enums` | **Có.** `TrackEventForm` mang `AnalyticsEventType` |
| `dto` → `enums` | **KHÔNG.** `grep -l "import com.portfolio.platform.enums" dto/*.java` không ra file nào |

Nới một rào kiến trúc cho phụ thuộc không tồn tại chính là thứ A-01…A-03 từng nói tới: rào chỉ
có tác dụng bằng đúng độ chặt của nó, và mỗi lần nới "cho chắc" là một lần nó mất giá trị mà
không ai thấy — vì suite vẫn xanh. Đã trả lại `dto → Set.of("model")`.

Hai chỗ kia giữ nguyên, có lý do.

### A-07 — Secret hash IP bị nhân bản thành hai chỗ, một chỗ là code chết (MINOR — **đã sửa ở `ea8e7de`**)

```java
String secret = analyticsProperties.getIpHashSecret();
if (secret == null) {
    secret = "dev-only-analytics-secret-change-me";
}
```

`AnalyticsProperties.ipHashSecret` đã khởi tạo bằng đúng chuỗi đó, nên nhánh `null` không bao
giờ chạy. Nhưng nó làm hai việc xấu: nhân bản một secret **đang nằm công khai trong repo** thành
chỗ thứ hai, và tạo cảm giác "có fallback an toàn" ở đúng hàm mà cả tính ẩn danh của dữ liệu phụ
thuộc vào. Nếu secret thật sự null thì hỏng mới là kết quả đúng — hash tiếp bằng secret ai cũng
đọc được thì `ip_hash` quay về đúng tình trạng quyết định (g) viết ra để tránh.

### A-08 — Cả hai secret đều có default nằm trong repo, và chưa có gì bắt phải đổi (MAJOR khi deploy, chưa phải lỗi hôm nay)

`analytics.ip-hash-secret` mặc định `dev-only-analytics-secret-change-me`;
`jwt.access-secret` mặc định `dev-only-access-secret-change-me-32bytes`. Cả hai đọc env, nhưng
**không có gì fail nếu env không được đặt** — ứng dụng khởi động bình thường với secret công khai.

Hệ quả khác nhau nhưng đều nặng: JWT ký bằng secret công khai nghĩa là ai cũng tự phát hành được
token admin; `ip_hash` HMAC bằng secret công khai thì quay về đúng bài toán brute-force 2^32 mà
quyết định (g) viết ra để chặn.

Không phải lỗi của commit này — `jwt.access-secret` có từ plan 03. Nhưng giờ có **hai** cái,
nên phải chốt: **plan 15 (Docker/deploy) phải bắt cả hai là biến môi trường bắt buộc và fail
startup nếu giá trị vẫn là default dev.**

### A-09 — `GET /api/admin/analytics/summary` không cache, mỗi lần gọi là ba query (INFO)

`countByEventType` hai lần cộng một `GROUP BY ... ORDER BY COUNT(e) DESC` trên đúng cái bảng
tăng theo từng lượt khách. `V3__` có thêm index nên không tệ, nhưng dashboard plan 14 sẽ gọi
endpoint này mỗi lần mở trang, và dự án đã có sẵn Redis cache-aside cho endpoint GET.

Plan 14 nên cache nó với TTL ngắn. Không cần làm bây giờ — chưa có ai gọi.

### A-10 — `AnalyticsServiceImpl` chạm `Template` qua hai cửa (INFO)

Kiểm tồn tại qua `TemplateRepository.existsById`, tăng đếm qua `TemplateService`. Cả hai đều hợp
lệ theo allow-list và không sai, nhưng cùng một aggregate mà đi hai đường. Nếu sau này
`TemplateService` thêm logic (soft-delete chẳng hạn) thì `existsById` sẽ bỏ qua logic đó — một
template đã xoá mềm vẫn "tồn tại" với analytics. Đáng nhớ khi plan 14 chạm tới.

### A-11 — `V3__analytics_indexes.sql` chưa từng chạy (ghi nhận, commit body đã khai)

Suite chạy H2 với Flyway tắt. Migration này gia nhập R-03 và F-01 — nhóm "chưa từng đối chiếu
với Postgres thật". Commit body tự khai điều này, không cần ai hỏi.

---

## Điều làm tốt

- **Test M5 viết đúng ý chứ không đúng chữ.** Plan yêu cầu chứng minh secret nằm trong digest;
  test đổi secret rồi track lại cùng một IP và assert hash khác đi. Đây là khác biệt giữa một
  test có sức nặng và một test chỉ so hash với IP thô.
- **Comment WHY ở `resolveClientIp` nói đúng điều nguy hiểm**: client giả được
  `X-Forwarded-For`, nên giá trị này không bao giờ dùng cho quyết định bảo mật. Plan 09 sẽ cần
  đúng cảnh báo đó.
- **Truncate thay vì từ chối** cho UA/referrer, kèm comment giải thích vì sao analytics từ chối
  traffic thật thì tệ hơn lưu chuỗi bị cắt.
- **Tách hai controller** thay vì gộp public và admin, đúng lối `PublicTemplateController` /
  `AdminTemplateController` sẵn có.
- **Commit body khai mutation kèm thông điệp lỗi thật của từng cái** — kiểm lại được, và hai cái
  tôi kiểm đều khớp.

---

## Kết luận

**VERDICT: PASS — `6837c5e` + `ea8e7de`.**

Plan 08 xong cả hai task. 92/92, +13 test. T-02 đóng có dây thật và có mutation chứng minh.
Bảy quyết định thiết kế được làm đủ, kể cả cái khó nhất là HMAC có khoá.

Hai finding đã sửa ngay. A-08 là thứ nặng nhất nhưng nó là chuyện của lúc deploy, không phải lỗi
đang chạy.

| Finding | Xử lý |
|---|---|
| A-06 | **Đã sửa** (`ea8e7de`) |
| A-07 | **Đã sửa** (`ea8e7de`) |
| **A-08** | **Plan 15 phải bắt buộc cả hai secret là env thật và fail startup nếu còn giá trị dev** |
| A-09 | Plan 14 — cache summary với TTL ngắn |
| A-10 | Ghi nhận; `existsById` bỏ qua soft-delete của `TemplateService` |
| A-11 | Gia nhập R-03/F-01 — migration chưa từng chạy thật |
