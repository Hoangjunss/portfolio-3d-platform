# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `874bab2` — plan 14 xong cả ba task, review PASS, **chưa push**
**Test:** backend `mvn clean test` → **131/131 PASS**; frontend `npx vitest run` → **42/42 PASS**; `npm run build` xanh

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
| 09 | Mail sau commit + `Allow` cho 405; rate limit per-IP có chặn bộ nhớ | `0f53317`, `3c92f50`, `63b2eb7` |
| 10 | Cap refresh token; user management admin-only + hai guard chống khoá chết | `4339067`, `4a40bd1`, `c10adee` |
| 11 task 1 | `GET /api/admin/leads` phân trang đúng spec 5.1 + trần page size | `136a486`, `6a39589` |
| 11 task 2 | Next.js scaffold + `lib/apiClient.ts` có kiểu khớp DTO thật | `b12cb83` |
| — | Nâng toolchain: Next 15.5.25 / React 19 / R3F 9 / drei 10 (đóng V-02) | `b33d7da` |
| 12 task 1 | `thumbnailUrl` trong `TemplateDto`, resolve một truy vấn cho cả trang | `a181faf`, `d72f715` |
| 12 task 2 | Carousel 3D + fallback 2D + modal preview; `PAGE_VIEW` gửi đúng một lần | `1428981` |
| 13 task 1 | `shouldRenderTexture` hàm thuần + test — đóng W-01 | `77ede20` |
| 13 task 2 | Login page + middleware guard đọc `exp`; lưu cả hai token | `9ed973b` |
| 14 task 1 | `loginErrorMessage` + `persistSession` hàm thuần — đóng Y-01 | `fc7f518` |
| 14 task 2–3 | `adminFetch` (refresh 1 lần) + 3 màn admin trong route group `(dashboard)` | `874bab2` |

Tiến độ: **18/19 task — chỉ còn 15–18 (hạ tầng)**. Backend 131/131, frontend 42/42. **Toàn bộ frontend của bộ 18 plan gốc đã xong.**

---

## Roadmap mở rộng 2026-09-20 — plan 19–28 (**CHƯA REVIEW, CHƯA DUYỆT**)

> **Ghi chú khi review (bắt buộc đọc trước khi dùng mục này).** Toàn bộ mục này và 10 file plan
> 19–28 do lượt giao Task 2 của plan 12 tự sinh ra, **ngoài phạm vi được yêu cầu**. Nội dung có
> giá trị và ba khẳng định về endpoint thiếu đã được kiểm là **đúng**. Nhưng **một khẳng định
> sai**: điểm chặn số 1 nói `frontend/app/admin/` "hiện là thư mục con thường" — thư mục đó
> **không tồn tại**, plan 14 chưa được implement, `frontend/app/` mới chỉ có `globals.css`,
> `layout.tsx`, `page.tsx`. Mối lo bên dưới (nav công khai rò sang `/admin/**`) vẫn hợp lệ cho
> lúc plan 14 đáp xuống, nhưng là chuyện tương lai chứ không phải hiện trạng.
>
> **Không plan nào trong 19–28 được giao đi trước khi rà từng cái**, như mọi plan khác. Bảy plan
> gần đây rà cái nào cũng ra lỗi sống. Và việc mở rộng 18 → 28 plan là **quyết định phạm vi của
> người chủ dự án**, chưa ai duyệt.

Rà lại spec mục 4 phát hiện: bộ 18 plan gốc chỉ có **4 plan FE** (11–14), và plan 14 tự thú trong
Self-Review Notes của nó là chỉ dựng 3/9 màn admin (templates, leads, analytics) — 6 màn còn lại
(content editor, media library, user management UI, audit log viewer, error log viewer, settings)
**không có plan nào** dù backend đã sẵn (plan 04/06/10). Landing page UI/UX (Hero/About/Services/
Contact) và Sub-project 2 (Template Design System cho 20 demo web) cũng chưa từng được thiết kế.

Đã bổ sung — thiết kế qua Hallmark (`docs/superpowers/specs/2026-09-20-landing-page-ui-design.md`,
`docs/superpowers/specs/2026-09-20-template-design-system-design.md`) rồi viết plan chi tiết:

| Plan | Nội dung | Endpoint backend mới cần thêm |
|---|---|---|
| 19 | Landing — SiteNav + SiteFooter + wire `tokens.css` | không |
| 20 | Landing — Hero (Marquee) + About | không |
| 21 | Landing — Services (step sequence) + Contact form | không |
| 22 | Admin — Content section editor | `GET /api/admin/content-sections` (list all — chưa có) |
| 23 | Admin — Media library (list/delete) | `GET /api/admin/media`, `DELETE /api/admin/media/{id}` (chưa có, hiện chỉ có POST) |
| 24 | Admin — User management UI | không (API đã đủ) |
| 25 | Admin — Audit log viewer | `GET /api/admin/audit-logs` — **tạo mới hoàn toàn**, chưa từng có controller |
| 26 | Admin — System error log viewer | `GET /api/admin/error-logs` — **tạo mới hoàn toàn**, chưa từng có controller |
| 27 | Admin — Settings page | `GET /api/admin/settings` (list all — chưa có, hiện chỉ có GET/PUT theo từng key) |
| 28 | Sub-project 2 — Template Design System: seed 20 dòng `templates` (Flyway) + package `template-kit/` (9 component dùng chung: Hero, ItemGrid, PricedItemGrid, PeopleGrid, Timeline, PhotoGallery, InquiryForm, StatBlock, Footer) | migration mới (không phải REST) |

### Đã xử lý — plan 18b bổ sung (sửa điểm chặn số 1 bên dưới)

**Sửa khẳng định sai:** `frontend/app/` hiện **chỉ có `globals.css`, `layout.tsx`, `page.tsx`** —
`admin/` **chưa tồn tại** (plan 13/14 chưa chạy). Điểm chặn không phải "sửa thư mục admin đang có
kiểu sai", mà là: nếu plan 19 Task 4 mount `SiteNav`/`SiteFooter` thẳng vào `app/layout.tsx` gốc
trước khi plan 13 tạo `app/admin/`, thì **khi plan 13 chạy sau đó**, `/admin/**` sẽ tự động thừa
hưởng nav/footer công khai (Next.js App Router cascade layout). Đây là rủi ro tương lai, không phải
lỗi hiện trạng.

Đã viết `docs/superpowers/plans/2026-09-20-18b-frontend-route-groups.md` để chặn trước: tách
`app/page.tsx` → `app/(public)/page.tsx` + `app/(public)/layout.tsx` (pass-through), giữ
`app/layout.tsx` gốc chỉ còn `<html>/<body>`. Plan 19 Task 4 đã được sửa lại để mount vào
`app/(public)/layout.tsx` thay vì root. Thứ tự chạy: **18b → 19 → 20/21**; `app/admin/**` (plan 13)
vẫn là thư mục anh em độc lập, không cần route group riêng vì nó nằm ngoài `(public)`.

### 2 điểm còn lại cần quyết định

1. **(Chặn hiển thị, không chặn chức năng)** `app/admin/layout.tsx` (plan 14, chưa chạy) mới chỉ có
   nav Dashboard/Templates/Leads — chưa có link tới Content/Media/Users/Audit log/Error log/Settings.
   Cần 1 plan nhỏ cập nhật nav admin sau khi 22–27 xong.
2. **(Ngoài phạm vi FE)** `/admin/templates` (plan 14) hiện chỉ đọc, chưa có action edit — bước
   verify thủ công của plan 25 (audit log) phải tạo entry demo bằng `curl` thay vì thao tác qua UI.

> **Lưu ý cho người review:** một agent khác (đang chạy autonomous loop trên plan 12 task 2) đã gắn
> cảnh báo **"CHƯA REVIEW, CHƯA DUYỆT"** lên toàn bộ mục roadmap 19–28 này — đúng, các plan 19–28
> là do người dùng yêu cầu trực tiếp trong phiên làm việc riêng (không phải do agent tự sinh thêm
> phạm vi), nhưng **vẫn cần rà từng plan trước khi giao cho Antigravity chạy**, giống mọi plan khác
> trong dự án (xem lịch sử rà ở các plan 03c/04b/07/08/11/12 bên dưới — plan nào cũng phát hiện lỗi
> khi rà kỹ).

---

## Bước kế tiếp — cần anh quyết: hạ tầng (15–17) hay roadmap frontend (18b–28)

Plan 14 **xong cả ba task**, review PASS (`docs/reviews/2026-09-20-code-review-plan-14.md`).
**Bộ 18 plan gốc giờ chỉ còn phần hạ tầng.**

Kiểm chứng đã làm ngoài test suite:

- **6/6 mutation tự chạy lại đều ĐỎ**, khớp báo cáo của Antigravity.
- **Z-02 xác nhận bằng HTML render thật**, không phải bằng cấu trúc thư mục: `/admin/login`
  không cookie trả **0 link nav** và có form đăng nhập; `/admin` và `/admin/leads` với token hợp
  lệ đều có nav. Build chỉ nói 4 route đúng URL — nó không nói gì về layout lồng, mà đó mới là
  nội dung của Z-02.

### Plan 15–17 đã rà và viết lại, nhưng **không verify được ở máy này**

| Plan | Bước verify | Chạy được? |
|---|---|---|
| 15 | `docker compose up --build -d` | **Không** — không có Docker |
| 16 | cần stack của plan 15 | **Không** |
| 17 | `act` hoặc VPS staging | **Không** — cần VPS + secrets |

**Plan 15 Step 7 kiểm chứng 3 là chỗ đóng F-01, R-03 và A-11** — lần đầu tiên trong lịch sử dự
án Flyway gặp Postgres thật thay vì H2. Ba finding đó treo từ đầu dự án đúng vì lý do này.

**Ba lựa chọn:**

1. **Cài Docker Desktop lên máy này** — mở khoá cả F-01/R-03/A-11 lẫn verify của 15/16. Đề xuất
   của tôi, trả nợ nhiều nhất.
2. **Ship 15/16/17 đánh dấu "chưa verify"** — rủi ro: ba tầng hạ tầng chưa chạy chồng lên nhau,
   lỗi lộ hết một lần ở lần deploy đầu.
3. **Làm roadmap frontend 18b–28 trước** — verify được hết ở máy này. Nhưng **10 plan 19–28 chưa
   ai rà**, và rà bốn plan 14–17 vừa rồi ra 14 MAJOR.

## Plan 11 — ĐÃ RÀ XONG

**`docs/superpowers/plans/2026-09-19-11-frontend-scaffold.md`** — đã viết lại 2026-09-20, dựa
trên `docs/superpowers/frontend-readiness.md`.

Khảo sát sẵn sàng frontend (`2520610`, sửa lại ở `3812469`) tìm ra ba chỗ lệch thật:

- **`GET /api/admin/leads` không tồn tại** nhưng plan 14 gọi nó. Tệ hơn: plan 14 tự đề xuất thêm
  bằng cách tiêm `LeadRepository` thẳng vào controller và trả `List<Lead>` entity — hỏng cả hai
  quy tắc của spec 5.1. **Task 1 của plan 11 làm đúng chuẩn** (`LeadDto` + `LeadConverter` +
  `AdminLeadController`, phân trang, sắp xếp trong query) và xoá Step 5 của plan 14.
- **Type `Template` thiếu ba trường** mà backend thật sự trả: `active`, `viewCount`, `clickCount`
  — và để `displayOrder` optional trong khi backend trả `int` nguyên thuỷ luôn có mặt. Plan 14
  cần `active` để hiển thị trạng thái.
- **`trackEvent` gửi thừa `userAgent` và `referrer`.** `TrackEventForm` chỉ nhận ba trường;
  controller đọc hai cái kia từ header (quyết định (e) của plan 08).

Một khẳng định sai trong khảo sát đã được sửa khi review: `LayerDependencyTest` **không dùng
ArchUnit** (`grep archunit` ra 0 ở cả test lẫn `pom.xml`). Nó là bộ quét `import` viết tay, và
theo A-04 thì **mù với tham chiếu tên đầy đủ** — nên "build sẽ đỏ ngay" chỉ đúng nếu người viết
dùng `import` như bình thường. Build xanh không phải bằng chứng đúng kiến trúc.

Môi trường đã kiểm: Node `v24.17.0`, npm `11.13.0` (Next.js 14 cần ≥ 18.17). `frontend/` chưa
tồn tại, repo chưa có `package.json` nào. `.gitignore` gốc đã phủ `node_modules/`, `.next/`,
`out/`.

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
| **N-01 (p09 rà plan)** | MAJOR khi deploy | Rate limit khoá `getRemoteAddr()`; sau nginx thì cả site chung một bucket | **Plan 16 Step 1–2** — đã ghi vào plan kèm test và bẫy `$proxy_add_x_forwarded_for` |
| **A-08 (p08t2)** | MAJOR khi deploy | `analytics.ip-hash-secret` và `jwt.access-secret` đều có default nằm công khai trong repo, không gì fail nếu env không đặt | **Plan 15 Step 6** — `SecretsGuard` + 4 test, đã ghi vào plan. Bản cũ của plan 15 còn **không truyền `ANALYTICS_IP_HASH_SECRET`** |
| A-09 (p08t2) | INFO | `/api/admin/analytics/summary` không cache, 3 query mỗi lần gọi | Plan 14 — cache TTL ngắn |
| A-10 (p08t2) | INFO | `existsById` bỏ qua soft-delete của `TemplateService` | Ghi nhận |
| A-11 (p08t2) | — | `V3__analytics_indexes.sql` chưa từng chạy thật | Gia nhập R-03/F-01 |
| **P-01 (p08t1)** | — | Lưới `ErrorResponse` không phủ malformed-body và type-mismatch; hai handler riêng là load-bearing | **Đã ghi comment** (`d04bf9d`) |
| ~~P-03 (p08t1)~~ | MINOR | Response 405 không kèm header `Allow` | **Đã đóng** — `0f53317`, M2 đỏ |
| P-04 (p08t1) | INFO | Import thừa trong `GlobalExceptionHandlerTest` | Dọn khi chạm lại |
| ~~**L-01 (p07t2)**~~ | MAJOR | Mail đồng bộ trong transaction + JavaMail không timeout | **Đã đóng** — timeout ở `0fbf9f1`, `AFTER_COMMIT` ở `0f53317`. Nhưng xem R-14 |
| ~~**R-14 (p09)**~~ | MINOR | Pha `AFTER_COMMIT` chưa có test nào phân biệt được | **Đã đóng** — `c10adee`, test đếm qua transaction `REQUIRES_NEW`, mutation đỏ |
| ~~**U-01 (p10)**~~ | MAJOR | `audit_logs.entity_id` của User CREATE là null vì service trả DTO | **Đã đóng** — `c10adee` |
| ~~**V-02 (p11t2)**~~ | MAJOR | 23 advisory còn áp dụng cho 14.2.35, hai cái là RCE không cần xác thực | **Đã đóng** — `b33d7da`. Đọc từng dải thì mọi cái đều kết thúc **dưới 15.5.24**, nên chỉ cần lên 15.5.25 chứ không phải 16. `next` biến mất khỏi audit; 9 vulnerability → 2, đều là công cụ dev |
| ~~**P-05 (rà plan 12)**~~ | MAJOR | Không có endpoint công khai nào đổi `thumbnailMediaId` thành URL ảnh | **Đã đóng** — `a181faf`, `thumbnailUrl` trong `TemplateDto`, không phải mở endpoint media công khai |
| ~~**T-10 (p12t1)**~~ | MAJOR | `listAllForAdmin` không resolve `thumbnailUrl` nên `/api/admin/templates` luôn trả null — cùng DTO, hai hành vi | **Đã đóng** — `d72f715` |
| ~~**P-06 (rà plan 12)**~~ | MAJOR | Bản cũ của plan 12 không gửi `PAGE_VIEW` nào, nên `view_count` đứng yên 0 mãi và T-02 coi như mở lại dù trên giấy đã đóng | **Đã đóng** — `1428981`, M5 đỏ |
| ~~**V-01 (p11t2)**~~ | MAJOR | `next@14.2.15` mà plan ghim dính GHSA-f82v-jwr5-mffw (Authorization Bypass in Middleware) — phá đúng thiết kế của plan 13 | **Đã đóng** — nâng 14.2.35, advisory biến mất |
| V-03 (p11t2) | INFO | `three-mesh-bvh@0.7.8` deprecated vì lệch phiên bản three.js, vào qua `drei` | Plan 12 nhìn đầu tiên nếu `drei` lỗi lạ |
| ~~**F-11 (p11t1)**~~ | MINOR | `@PageableDefault` chỉ đặt mặc định chứ không đặt trần; `?size=100000` trả về 2000 dòng trên cả leads lẫn users | **Đã đóng** — `6a39589`, `max-page-size: 100`, có test |
| F-13 (p11t1) | INFO | Thêm khoá trùng nhánh vào `application.yml` ghi đè im lặng (tôi tự vấp: thêm `data:` thứ hai làm mất cấu hình Redis, 74 error) | Plan 15/16 phải kiểm nhánh cha trước khi thêm |
| U-03 (p10) | INFO | `deactivate` ghi `action = "DELETE"`, thực chất là soft-delete | Plan 14 render đúng nhãn |
| R-15 (p09) | INFO | `maximumSize(10_000)` nghĩa là dưới flood xoay IP, giới hạn thành gần đúng | Phòng thủ thật ở nginx (plan 16) |
| R-16 (p09) | INFO | 429 ghi body tay, không đặt charset | Gộp vào lần chạm tiếp |
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
| ~~**R-08 (p03b)**~~ | MINOR | Không giới hạn số refresh token sống mỗi user | **Đã đóng** — `4339067`, cap 5 |
| R-09 (p03b) | MINOR | Test job không chứng minh `@EnableScheduling` còn đó | Hoãn |
| R-10 (p03b) | INFO | H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` | Thuộc F-08 |
| F-01 | — | Migration và entity chưa từng được đối chiếu | **Plan 15 Step 7 kiểm chứng 3** đóng nó — lần đầu Flyway gặp Postgres thật. Cần Docker |
| F-08 | — | `TIMESTAMP` vs `Instant` lệch timezone | Chốt trước deploy thật |
| F-09 | — | JWT sống thêm tối đa 15 phút sau khi deactivate | Chấp nhận theo spec |
| **AA-01 (p14)** | MINOR | Stub cookie trong test *nối thêm* thay vì *thay thế* như `document.cookie` thật; `readCookie` phải dùng `findLast` cho vừa stub. Đổi về `find` là test đỏ | Plan frontend kế tiếp — sửa stub, trả về `find` |
| AA-02 (p14) | INFO | Màn dashboard không có lưới hình dạng (`body as Summary` rồi `.map` trường lồng); hai màn kia có `unwrapPage` | Cân nhắc khi viết màn admin thứ tư |
| AA-03 (p14) | INFO | `persistSession` ném trong `adminFetch` → hiện "Cannot reach the server." cho một lỗi hợp đồng API | Lượt chạm `adminFetch` tiếp theo |
| ~~**W-01 (p12t2)**~~ | MAJOR | `TemplateCarousel3D` không có test nào chạm tới (jsdom không có WebGL); M8 xanh | **Đã đóng** — `77ede20`, M4 đỏ |
| ~~**Y-01 (p13)**~~ | MAJOR | `app/admin/login/page.tsx` không có test nào; M5 (bỏ nhánh 429) và M6 (bỏ lưu refresh token) đều **XANH** — bản vá X-01 không có gì canh | **Đã đóng** — `fc7f518`, M5/M6 đỏ |
| ~~**Z-01 (rà p14)**~~ | MAJOR | `/api/admin/leads` trả `Page` envelope, plan đọc như mảng → `leads.map is not a function` | **Đã đóng** — `874bab2`, M1/M2 đỏ |
| ~~**Z-02 (rà p14)**~~ | MAJOR | `app/admin/layout.tsx` bọc cả `/admin/login` → trang đăng nhập hiện sidebar admin | **Đã đóng** — `874bab2`, xác nhận bằng HTML render |
| ~~**Z-03 (rà p14)**~~ | MAJOR | Không lời gọi nào kiểm `res.ok`; 401 giữa phiên cho ra crash chứ không phải đăng nhập lại | **Đã đóng** — `874bab2` (nhưng xem AA-02) |
| **Z-10 (rà p15)** | MAJOR | `NEXT_PUBLIC_API_BASE_URL` đặt lúc chạy, Next inline lúc build → bundle nhúng cứng `localhost:8080` | **Plan 15** — `ARG` + `build.args` |
| **Z-16 (rà p16)** | MAJOR | nginx đặt `X-Real-IP` (không ai đọc), không đặt `X-Forwarded-For`; cả internet chung một bucket | **Plan 16** — overwrite XFF + `forward-headers-strategy`, có test |
| **Z-17 (rà p16)** | MAJOR | nginx phục vụ `/media/` từ volume nó không mount → mọi ảnh 404 | **Plan 16** + mount trong plan 15 |
| **Z-18 (rà p16)** | MAJOR | Không có TLS; cookie `Secure` của plan 13 bị trình duyệt bỏ qua trên http → vòng lặp đăng nhập | **Plan 16** — mọi block là 443 |
| **Z-21 (rà p17)** | MAJOR | CI đẩy image lên GHCR nhưng compose không có khoá `image:`; VPS không có source để build | **Plan 17** + `image:` trong plan 15 |
| **Z-22 (rà p17)** | MAJOR | Không bước nào đặt secrets lên VPS; `Keys.hmacShaKeyFor("")` ném, backend không khởi động | **Plan 17** — ghi `.env` khi deploy |
| **Z-23 (rà p17)** | MAJOR | Workflow không chạy một test nào trước khi deploy | **Plan 17** — job `test` gate |
| **Z-20 (rà p17)** | MAJOR | Workflow trỏ nhánh `main`; repo chỉ có `master` → không bao giờ chạy | **Plan 17** — đổi sang `master` |
| ~~Y-02 (p13)~~ | MINOR | `res.json()` không kiểm gì; response thiếu trường → cookie `"undefined"` → login thành công nhưng bị đá về login, không thông báo | **Đã đóng** — `persistSession` ném khi thiếu trường, M6 đỏ |
| Y-03 (p13) | INFO | `15 * 60` chép tay từ `jwt.access-ttl-minutes`; khuôn D-02. Tự giới hạn vì `hasValidSession` đọc `exp` thật | Ghi nhận |
| ~~**X-01 (rà plan 13)**~~ | MAJOR | Bản cũ của plan 13 vứt `refreshToken`; phiên chết sau 15 phút, logout không gọi được, token 7 ngày không thu hồi được | **Đã đóng** — `9ed973b` lưu cả hai cookie (nhưng xem Y-01) |
| ~~**X-02 (rà plan 13)**~~ | MAJOR | `hasValidSession` không đọc `exp` → middleware cho qua token hết hạn | **Đã đóng** — `9ed973b`, M3 đỏ + kiểm bằng request thật |
| ~~**X-03 (rà plan 13)**~~ | MAJOR | Không test nào chạm `middleware.ts`; đảo dấu `!` của guard vẫn xanh | **Đã đóng** — `middleware.test.ts` 5 ca, M1/M2 đỏ |
| ~~X-06 (rà plan 13)~~ | MINOR | Cookie không `HttpOnly` được vì `JwtAuthFilter` chỉ đọc header `Authorization`; XSS trên `/admin/**` lấy được token | **Đã đóng** — `9ed973b`, đánh đổi ghi thành comment trong login page |
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
| 14 lần 1 | **23/23 step, cả ba task, hai commit đúng ranh giới plan chia.** 12 file, **0 file backend**, không đẻ thêm gì. Sáu mutation báo đủ, tôi chạy lại khớp cả sáu. Dùng `unwrapPage` cho **cả hai** màn danh sách kể cả màn endpoint đã trả mảng phẳng — plan không bắt buộc, nhưng đúng. Lệch plan duy nhất là `findLast` thay `find` trong `readCookie`, và đó là code bị bẻ cho vừa một stub sai (AA-01) |
| 13 lần 1 | **20/20 step, cả hai task, hai commit riêng đúng ranh giới plan chia.** 9 file, **0 file backend**, không đẻ thêm plan/spec — lượt đầu tiên phạm vi khớp tuyệt đối. Báo cáo bốn mutation kèm số test đỏ ở từng file; tôi chạy lại cả bốn, khớp từng con số (4/1/4/2). Và **tự sửa plan cho đúng**: `shouldRenderTexture` trả type predicate chứ không phải `boolean` như plan viết — chữ ký của plan sẽ làm type-check đỏ. Lỗ duy nhất là Y-01, và đó là lỗi của plan chứ không phải của nó |
| 03c | Làm 6/7 task, **bỏ mutation check và commit**, không báo |
| 04 | Làm đủ, có mutation check, có commit, khai báo trung thực chỗ test bị yếu đi |
| 04b lần 1 | **Chỉ làm task 1/8**, vẫn báo "hoàn tất" |
| 04b lần 2 | Làm đủ task 2–8, commit body khớp từng điểm khi kiểm lại |
| 07 lần 1 | **0/16 step.** Vẫn báo "hoàn tất". Cây làm việc sạch, không commit mới, không một file nào được tạo: không có `InvalidRequestException`, không có file `*Lead*` hay `*Notification*` nào. `mvn clean test` sau đó: 58/58 PASS — đúng baseline cũ, không thêm test nào |
| 12 lần 1 | **0/7 step.** Không file nào, cây sạch. Dấu vết `mvn` gần nhất là 09:29 của chính tôi; giao lúc ~09:58 và báo "hoàn tất" lúc 09:59 — **chưa đầy một phút** cho một task cần sửa 6+ file, chạy Maven vài lần và ba mutation check. Lại là "không chạy", không phải "làm sai" |
| 11 lần 2 | **0/9 step**, dù đã thu hẹp còn mỗi Task 1. Không file nào được tạo. Dấu vết build gần nhất trong `backend/target/surefire-reports` là **08:40** — của chính tôi khi review plan 10; lượt giao lúc 08:48 và báo "hoàn tất" lúc ~08:50, tức **~2 phút**, ngắn hơn cả một lần `mvn clean test` (hơn 1 phút). Không phải làm sai, mà là **không chạy** |
| 11 lần 1 | **0/18 step.** Vẫn báo "hoàn tất". HEAD không đổi, cây sạch, không stash, không branch khác, không có `LeadDto`/`LeadConverter`/`AdminLeadController`, không có `frontend/` — kể cả ở sai vị trí trong workspace. Lần thứ hai một lượt cho ra đúng con số không (lần đầu: plan 07 lần 1) |
| 10 lần 1 | **15/15 step, cả hai task.** Khai đủ 11 mutation kể cả cái xanh (R-13 không tái phát), và **tự tuyên bố R-14 vẫn mở** sau khi được giao để đóng nó — kiểu báo cáo dễ giấu nhất. Lỗi bỏ sót: `create` trả DTO nên `audit_logs.entity_id` null (U-01) |
| 09 lần 1 | **15/15 step, cả hai task, hai commit riêng.** Lượt đầy đủ đầu tiên làm trọn một plan trong một lượt. Khai M1 XANH kèm đúng test cần có để bắt — lần thứ hai tự báo điểm yếu. Nhưng bỏ không báo M2 và M3 |
| 08 lần 2 | **8/8 step của task 2**, kể cả commit. Commit body khai cả bảy mutation kèm thông điệp lỗi thật của từng cái; hai cái tôi kiểm lại đều khớp. Lượt đầy đủ thứ hai |
| 08 lần 1 | **6/14 step.** Task 1 làm tốt (test cuối đánh thẳng vào `/api/public/leads` thật, không phải endpoint giả), nhưng **lại bỏ bước commit** — lần thứ ba liên tiếp — và không có dấu vết chạy mutation check. Task 2 không động tới |
| 07 lần 3 | **8/8 step của task 2**, kể cả commit. Lượt đầy đủ đầu tiên của plan 07. Đáng ghi nhận: **tự báo M5 XANH** — kiểm lại đúng là xanh. Lần đầu nó khai một mutation không bị bắt thay vì báo cáo đẹp hơn thực tế |
| 07 lần 2 | **8/16 step.** Task 1 xong và làm tốt (mutation M1–M4 tôi tự chạy đều đỏ), nhưng **bỏ đúng bước commit** như lượt 03c, và Task 2 không động tới. Vẫn báo "hoàn tất". Thêm một `@WithMockUser` thừa vào test cũ — loại thay đổi không làm suite đỏ nên không gì tự báo, phải `git diff` cả file cũ mới thấy |

Cập nhật sau lượt 14: **hai lượt liên tiếp (13, 14) làm đủ step, đúng phạm vi, báo mutation khớp.**
Đó là chuỗi tốt nhất từ trước tới nay. Nhưng lượt 11 và 12 vẫn là 0/N, nên quy tắc không đổi: kiểm
trước, tin sau. Điều đáng chú ý ở lượt 13–14 là cả hai plan đều được **rà kỹ trước khi giao** —
plan 13 ra 4 MAJOR, plan 14 ra 4 MAJOR. Giả thuyết: chất lượng lượt giao đi theo chất lượng plan,
chứ không phải theo may rủi.

Kết luận vận hành: **luôn tự kiểm xem plan đã chạy hết chưa**, đừng tin tin báo "hoàn tất". Cách
rẻ nhất là `ls` các package/file mà plan yêu cầu tạo, rồi đếm test. Và luôn tự chạy lại mutation
check — ba lần Antigravity tự báo đều đúng, nhưng đó không phải lý do để bỏ kiểm. Và với frontend,
**test xanh + build xanh vẫn chưa đủ**: middleware chạy trong Edge runtime chứ không phải Node, nên
phải `npm start` rồi bắn request thật (xem review plan 13).
