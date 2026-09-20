# Code Review — Plan 09 (rate limiting + hai finding mang sang)

**Ngày:** 2026-09-20
**Phạm vi:** commit `0f53317` (task 1), `3c92f50` (task 2), siết thêm ở `63b2eb7`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-09-rate-limiting.md`
**Người viết code:** Antigravity (lượt 6) — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 1 (7 step) + Task 2 (8 step) | **Xong cả 15**, hai commit riêng đúng như plan |
| Tám quyết định (a)–(h) | Làm đủ cả tám |
| Caffeine thêm vào `pom.xml`, không pin version | Đúng |
| Không đụng `SecurityConfig`, **không nới allow-list** | Đúng — A-06 không tái phát |
| `mvn -f backend/pom.xml clean test` | **103/103 PASS** |
| Số test trước / sau | 92 → 103 (+11) |

Lượt đầy đủ đầu tiên làm **cả hai task trong một lượt**.

### Mutation check

| # | Nó báo | Tôi kiểm lại |
|---|---|---|
| M1 — `AFTER_COMMIT` → `BEFORE_COMMIT` | **XANH**, kèm giải thích cần test nào mới bắt được | Không chạy lại; xem R-13 |
| M2 — bỏ header `Allow` | **không báo cáo** | **Tôi chạy: ĐỎ** (`Response header 'Allow'`) |
| M3 — gọi `notifyNewLead` trực tiếp lại | **không báo cáo** | Chưa chạy |
| M8 — gỡ đăng ký filter | ĐỎ | **Đúng — ĐỎ**, `expected:<429> but was:<202>` |
| (c) chặn size cache | M4 ĐỎ | **Đúng — ĐỎ.** Nâng `maximumSize` lên 1.000.000 → `bucketCache_staysBounded` đỏ |
| M5, M6, M7, M9 | ĐỎ | Không chạy lại |

**M8 là mutation đáng giá nhất của plan này.** Bản plan cũ chỉ có unit test dùng mock, nên gỡ
hẳn `@Bean` đăng ký filter vẫn xanh — rate limiting sẽ "tồn tại" trong code mà không chạy trên
một request nào. Test tích hợp bắt được đúng điều đó.

---

## Phát hiện

### R-11 — Nhánh tra khoá `"[path]"` là code chết (MINOR — **đã sửa ở `63b2eb7`**)

`RateLimitProperties.getLimitSpec` tra `paths.get(normalized)` rồi nếu null tra tiếp
`paths.get("[" + normalized + "]")`. Nhánh thứ hai có vẻ hợp lý vì trong `application.yml` khoá
được viết là `"[/api/auth/login]"`.

Đo thật: xoá hẳn nhánh fallback rồi chạy `RateLimitIntegrationTest` — test này đọc
`application.yml` thật chứ không dựng properties bằng tay — **vẫn xanh**. Nghĩa là relaxed
binding của Spring đã bỏ ngoặc vuông lúc bind, và nhánh kia chưa từng chạy.

Đáng nói vì nó là loại code "phòng xa" không ai kiểm được bằng mắt: đọc thì thấy hợp lý, và nếu
đoán sai chiều thì chính nhánh *thứ nhất* mới là nhánh chết. Chỉ một phép đo phân biệt được.

### R-12 — `getCache()` là public chỉ để phục vụ test (MINOR — **đã sửa ở `63b2eb7`**)

Test nằm cùng package `com.portfolio.platform.filter`, nên package-private là đủ. Mở rộng API
của lớp production vì lý do test là cái giá không cần trả.

### R-13 — Hai mutation của task 1 không được báo cáo (MINOR, lỗi quy trình)

Commit body của `0f53317` khai M1 rất trung thực — kể cả việc nó **XANH** và nêu đúng assertion
nào mới bắt được. Nhưng M2 và M3 thì không có dòng nào. Tôi chạy M2: **ĐỎ**. M3 chưa ai chạy.

Khai một kết quả bất lợi rồi im lặng về hai cái còn lại là kiểu báo cáo dễ gây hiểu nhầm nhất —
người đọc thấy sự trung thực ở M1 rồi mặc định phần còn lại cũng đã chạy.

### R-14 — Pha `AFTER_COMMIT` vẫn chưa có test nào chứng minh (MINOR, mang sang plan 10)

M1 xanh là một finding thật, không phải lỗi báo cáo. Hiện `NotificationServiceImpl` nuốt
`MailException`, nên đổi `AFTER_COMMIT` thành `BEFORE_COMMIT` không test nào thấy — mà đó chính
là toàn bộ nội dung của L-01 nửa sau.

Test phân biệt được: `@MockBean NotificationService` ném `RuntimeException` (không phải
`MailException`, để không bị nuốt), POST một lead, rồi assert **lead vẫn nằm trong bảng**. Với
`AFTER_COMMIT` transaction đã commit nên lead còn; với `BEFORE_COMMIT` exception làm rollback nên
lead biến mất. Ba dòng, và nó biến một quyết định kiến trúc thành một thứ kiểm được.

**Plan 10 task 1 phải thêm test này.** Không có nó, L-01 nửa sau đóng trên giấy.

### R-15 — Cái bound đánh đổi enforcement lấy an toàn bộ nhớ, và điều đó chưa được ghi (INFO)

Quyết định (c) đúng: map không giới hạn trên heap 350MB biến bộ rate limit thành đúng đòn DoS nó
sinh ra để chặn. Nhưng hệ quả mặt kia chưa ai viết xuống: với `maximumSize(10_000)`, một kẻ tấn
công xoay IP đủ nhanh sẽ **đẩy bucket của chính nó ra khỏi cache**, và bucket mới luôn đầy. Tức
là dưới áp lực, giới hạn trở thành gần đúng chứ không tuyệt đối.

Đây vẫn là đánh đổi đúng — an toàn bộ nhớ trước. Nhưng phải ghi, để lần sau không ai ngạc nhiên
khi thấy rate limit "không chặt" dưới tải cao, và để plan 16 biết lớp phòng thủ thật cho kiểu
flood đó nằm ở nginx chứ không ở đây.

### R-16 — `response.getWriter()` không đặt charset (INFO)

Message hiện toàn ASCII nên chưa có lỗi. Nhưng đây là response duy nhất trong ứng dụng được ghi
tay thay vì qua `HttpMessageConverter`. Nếu ai đó dịch `"Too many requests"` sang tiếng Việt thì
chữ sẽ hỏng. `response.setCharacterEncoding("UTF-8")` là một dòng.

---

## Điều làm tốt

- **`Retry-After` tính từ `probe.getNanosToWaitForRefill()`** thay vì một hằng số như plan gợi ý.
  Client nhận đúng số giây còn lại thật, không phải độ dài cửa sổ.
- **Thêm test `trailingSlash_isNormalizedAndSharesBucket`** mà plan không yêu cầu — đúng chỗ
  quyết định (f) lo, và nó biến một câu văn trong plan thành một assertion.
- **Khai M1 XANH và nêu luôn test nào mới bắt được.** Lần thứ hai nó tự báo một điểm yếu thay vì
  làm đẹp báo cáo, và lần này còn nói được cách sửa.
- **Comment về thứ tự filter** nói rõ rằng đặt sau chain của Security là có chủ ý và việc dời lên
  trước là thay đổi có cân nhắc, không phải dọn dẹp.
- **Ghi yêu cầu `forward-headers-strategy` vào commit body** để plan 16 thừa hưởng, đúng như
  quyết định (g) dặn.

---

## Kết luận

**VERDICT: PASS — `0f53317` + `3c92f50` + `63b2eb7`.**

103/103, +11 test. Cả bốn lỗ của bản plan cũ đều được bịt, và M8 chứng minh bằng đo đạc rằng
filter thật sự nằm trên đường đi của request — điều bản plan cũ không thể chứng minh.

Hai finding đã sửa. R-14 là thứ duy nhất đáng mang sang: L-01 nửa sau hiện đúng về mặt code
nhưng **chưa có test nào phân biệt được nó với bản sai**.

| Finding | Xử lý |
|---|---|
| R-11 | **Đã sửa** (`63b2eb7`) |
| R-12 | **Đã sửa** (`63b2eb7`) |
| R-13 | Ghi nhận — mọi lượt sau phải khai đủ mutation, kể cả cái đỏ |
| **R-14** | **Plan 10 task 1** — thêm test phân biệt `AFTER_COMMIT` với `BEFORE_COMMIT` |
| R-15 | Ghi nhận; phòng thủ flood thật nằm ở nginx (plan 16) |
| R-16 | Một dòng `setCharacterEncoding`, gộp vào lần chạm tiếp theo |
