# Code Review — Plan 16 (Nginx, TLS, real client IP)

**Ngày:** 2026-09-20
**Phạm vi:** commit `93a4ee6` (Task 0), `5737471` (Task 1)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-16-nginx-subdomains.md`
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 0, step 0.1–0.4 | **Xong**, kể cả commit |
| Task 1, step 1–7, 9 | **Xong**, kể cả commit |
| Step 8 (`docker compose` routing) | **Không chạy được** — không có Docker. Khai báo trung thực, checkbox để trống |
| `mvn -f backend/pom.xml test` | **137/137 PASS** (135 → 137) |
| `SecretsGuardWiringTest` | 1/1 PASS |
| `RateLimitForwardedIpTest` | 1/1 PASS |
| **F-13** (khoá `server:` trùng nhánh) | **Tránh được** — đúng một `server:` top-level, `port: 8080` còn nguyên |
| Phạm vi | 10 file, không đẻ thêm plan/spec |
| Cây làm việc | Sạch |

**Lần đầu Antigravity làm trọn một plan hai task mà không bỏ bước commit.** Hai commit đúng ranh
giới Task 0 / Task 1, và cả hai commit body đều nêu đúng giới hạn của mình.

### Mutation check — plan yêu cầu, commit không báo, tôi tự chạy

| # | Revert gì | Kết quả |
|---|---|---|
| MC | Bỏ `@Component` khỏi `SecretsGuard` | **ĐỎ** — `SecretsGuardWiringTest` 1 failure |
| MD | Bỏ `forward-headers-strategy: framework` | **ĐỎ** — `RateLimitForwardedIpTest` 1 failure |

Cả hai có trọng lượng thật. **AB-02 đóng** (gỡ annotation giờ làm suite đỏ) và **N-01 đóng** (bỏ
cấu hình proxy giờ làm suite đỏ). Trước đó cả hai mutation này đều XANH.

### Thứ tự filter — chỗ có thể làm N-01 mở lại âm thầm

`forward-headers-strategy: framework` chỉ có tác dụng nếu `ForwardedHeaderFilter` chạy **trước**
`RateLimitFilter`. Kiểm:

| Filter | Order |
|---|---|
| `ForwardedHeaderFilter` (Spring Boot tự đăng ký) | `Ordered.HIGHEST_PRECEDENCE` |
| `RateLimitFilter` (`RateLimitConfig`) | `SecurityProperties.DEFAULT_FILTER_ORDER + 1` = **−99** |

Đúng thứ tự, và cách nhau đủ xa để không mong manh. Quan trọng hơn: MD đỏ nghĩa là
`RateLimitForwardedIpTest` **canh được chính chỗ này** — nếu ai đổi order của `RateLimitFilter`
lên trước, test sẽ bắt.

Một hệ quả phụ tốt không nằm trong plan: `AuditAspect:39` cũng đọc `getRemoteAddr()`, nên từ nay
`audit_logs.ip_address` ghi IP khách thật thay vì IP container nginx.

---

## Phát hiện

### AC-01 — Đường ACME challenge trỏ vào thư mục không được mount, và mâu thuẫn với chính plan (MINOR)

`nginx/conf.d/00-redirect.conf`:

```nginx
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}
```

Hai vấn đề chồng nhau:

1. **`/var/www/certbot` không được mount vào container nginx.** Plan 15 mount cho service `nginx`:
   `./nginx/conf.d`, `./templates-static`, `./nginx/certs`, `media-data`. Không có certbot webroot.
   Đường này trả 404.
2. **Nó sẽ không bao giờ được dùng.** Chính plan 16 ghi ở Self-Review Notes: cert là **wildcard**
   `*.portfolio.com`, mà wildcard **bắt buộc DNS-01** — HTTP-01 không cấp được wildcard. Đường
   `/.well-known/acme-challenge/` chỉ phục vụ HTTP-01.

Nên đây là code chết **ngụ ý sai**: người vận hành đọc config sẽ tưởng gia hạn cert chạy qua
webroot HTTP-01 và đi cấu hình certbot theo hướng đó, rồi thất bại vì lý do không nhìn thấy trong
file này.

**Lỗi này là của plan tôi viết**, không phải của người implement — tôi viết nguyên block đó vào
Step 3. Hai cách sửa đều chấp nhận được: bỏ hẳn block và ghi một dòng comment nói cert đi qua
DNS-01; hoặc giữ lại và mount `./nginx/certbot:/var/www/certbot` trong plan 15 để nó thật sự dùng
được cho cert không-wildcard sau này. Tôi nghiêng về cách một — ít thứ giả vờ hoạt động hơn.

### AC-02 — Plan yêu cầu báo cáo mutation ở hai chỗ, commit body không có (quy trình)

Step 0.3 viết: *"chạy mutation... confirm it is **RED**. Restore it. **Report the result**."*
Step 2 viết: *"test **must FAIL** before Step 1 ... and **PASS** after — nếu nó xanh cả hai chiều
thì nó không đo gì cả"*.

Hai commit body nêu giới hạn rất tốt (Step 8 không chạy được; `@PostConstruct` vẫn là finding mở)
nhưng **không nêu kết quả mutation nào**. Đây là lần đầu kể từ plan 08 mà một lượt không kèm báo
cáo mutation.

Tôi chạy cả hai và cả hai đều đỏ, nên **kết quả thì đúng** — nhưng nếu tôi không chạy thì không
có gì chứng minh, và hai test này chính là toàn bộ giá trị của Task 0 và của việc đóng N-01.

Không phải lỗi code. Ghi vào hồ sơ theo dõi công cụ vì nó là thứ dễ trượt dần.

### AC-03 — Không có `default_server` cho 443 (INFO)

Ba block 443 đều không khai `default_server`. nginx sẽ dùng block đầu tiên nạp được cho cổng đó,
và conf.d nạp theo thứ tự alphabet — `api.conf` trước `portfolio.conf` và `templates.conf`. Nên
một request HTTPS với `Host` không khớp gì (ví dụ gọi thẳng bằng IP) rơi vào **API**.

Tác động thấp: backend không định tuyến theo host, và mọi endpoint admin vẫn yêu cầu JWT. Nhưng
"cái gì không khớp thì rơi vào API" là mặc định đáng ghi ra chứ không nên là tình cờ theo tên file.

### AC-04 — Không có HSTS (INFO)

Toàn bộ bản vá Z-18 dựa trên việc site chạy HTTPS, nhưng không có
`Strict-Transport-Security`. Mỗi lần người dùng gõ `portfolio.com` là một vòng HTTP không mã hoá
trước khi 301. Redirect đã che phần lớn rủi ro, và bật HSTS sai cách thì khó gỡ — nên đây là
quyết định nên làm có chủ đích ở plan deploy chứ không phải thêm lặng lẽ ở đây.

---

## Điều làm tốt

- **Giữ nguyên cả ba chỗ dễ bị "sửa cho gọn":** `proxy_set_header X-Forwarded-For $remote_addr`
  (không đổi sang `$proxy_add_x_forwarded_for`, thứ trông "chuẩn hơn" nhưng nối thêm vào giá trị
  client gửi và mở lại đúng lỗ hổng mà comment trong `RateLimitFilter` cảnh báo); mọi block
  `listen 443`; regex `server_name` cho wildcard.
- **Tránh F-13.** Thêm khoá vào `server:` đang có thay vì tạo block `server:` thứ hai. F-13 từng
  làm mất cấu hình Redis và sinh 74 error; đây là lần đầu một lượt đi qua đúng cái bẫy đó mà
  không vấp.
- **Đọc code trước khi viết test.** `RateLimitForwardedIpTest` dùng `status().isAccepted()` (202)
  chứ không phải 201 như tôi đoán trong lượt giao, và body khớp `LeadCreateForm` thật. Nó cũng
  tự thêm `@MockBean NotificationService` — thứ plan không nhắc, nhưng cần, vì nếu không thì 5
  lần POST lead sẽ kéo theo 5 lần gửi mail.
- **Hai commit body nêu đúng giới hạn**, kể cả việc tự nhắc lại rằng mutation bỏ `@PostConstruct`
  vẫn là finding mở — thay vì để nó chìm.

---

## Kết luận

**VERDICT: PASS — `93a4ee6`, `5737471`. Sẵn sàng ship.**

137/137, hai test mới đều có trọng lượng (MC và MD đều đỏ), F-13 tránh được, và ba quyết định
thiết kế dễ hỏng nhất đều giữ nguyên.

**N-01 đóng** — sau nginx, rate limit và analytics giờ khoá trên IP khách thật thay vì để cả
internet chung một bucket. **AB-02 đóng** — gỡ `@Component` khỏi `SecretsGuard` giờ làm suite đỏ.

Vẫn phải nói rõ: **cấu hình nginx chưa từng được nạp bởi nginx.** Step 8 cần Docker. Bốn file
`.conf` là thứ duy nhất trong dự án chưa có một dòng nào chứng minh nó cú pháp đúng, chứ đừng nói
định tuyến đúng.

| Finding | Mức | Xử lý |
|---|---|---|
| **AC-01** | MINOR | **Plan 17** — bỏ block acme-challenge (cert là wildcard/DNS-01) hoặc mount webroot. Lỗi của plan 16 |
| AC-02 | — | Quy trình: lượt giao sau phải đòi báo cáo mutation rõ ràng hơn |
| AC-03 | INFO | Khai `default_server` cho 443 một cách có chủ đích |
| AC-04 | INFO | HSTS là quyết định của plan deploy, không thêm lặng lẽ |
| ~~**N-01**~~ | MAJOR khi deploy | **Đã đóng** — `forward-headers-strategy` + nginx ghi đè XFF, MD đỏ |
| ~~**AB-01**~~ | MAJOR | **Đã đóng** — `.dockerignore` cho từng build context |
| ~~**AB-02**~~ | MAJOR | **Đã đóng** — `SecretsGuardWiringTest`, MC đỏ |
| ~~**M-01**~~ | INFO | **Đã đóng** — `/media/` có `Content-Disposition: attachment` + `nosniff` |
| ~~**Z-16/17/18**~~ | MAJOR | **Đã đóng** về code; **chưa xác nhận vận hành** (Step 8 cần Docker) |
| **F-01, R-03, A-11** | — | **Vẫn mở.** Chỉ plan 15 Step 7 đóng được |
| `@PostConstruct` bị gỡ | — | **Vẫn mở** — cần test kích hoạt profile `prod`, kéo theo cấu hình DB thật |
