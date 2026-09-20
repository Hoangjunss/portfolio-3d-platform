# Code Review — Plan 15 (Docker) — lượt 2

**Ngày:** 2026-09-20
**Phạm vi:** 7 file mới + `frontend/next.config.mjs` + `.gitignore`, **Antigravity không commit**;
tôi commit ở `<commit của review này>`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-15-docker.md` (bản viết lại sau
`docs/reviews/2026-09-20-plan-review-14-to-17.md`)
**Người viết code:** Antigravity, lượt 2 (lượt 1 cho ra 0/8 step)

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Step 1–6 | **Xong** |
| Step 7 (`docker compose up`) | **Không chạy được** — không có Docker. Khai báo trung thực, không giả vờ đã chạy |
| Step 8 (commit) | **Bỏ.** Tôi commit |
| `mvn -f backend/pom.xml test` | **135/135 PASS** (131 → 135) |
| `SecretsGuardTest` | **4/4 PASS** |
| `LayerDependencyTest` | Xanh — `config` được miễn theo T-05, đúng dự đoán |
| `npx vitest run` | **42/42 PASS**, không hồi quy |
| `npm run build` | Sinh `.next/standalone/server.js` |
| Phạm vi | 9 file, không đẻ thêm plan/spec |

Nội dung 7 file khớp plan gần như từng dòng. `docker-compose.yml` có `SPRING_PROFILES_ACTIVE: prod`,
có `image:` lẫn `build:`, có `condition: service_healthy`, **không** có `JWT_REFRESH_SECRET` (đúng —
`JwtProperties` không có trường đó), và `ANALYTICS_IP_HASH_SECRET` có mặt.

### Kiểm chứng số 1 của Step 7 — chạy được **không cần Docker**

Plan viết bước này dưới dạng `docker compose exec frontend grep ...`, nhưng cái nó thật sự hỏi là
*"biến `NEXT_PUBLIC_*` có được inline vào bundle client lúc build không"*, và câu hỏi đó trả lời
được bằng chính `npm run build` với biến đặt sẵn:

```
$ NEXT_PUBLIC_API_BASE_URL="https://api.portfolio.com" npm run build
$ grep -rl "api.portfolio.com" .next/static
.next/static/chunks/app/admin/(dashboard)/leads/page-….js
.next/static/chunks/app/admin/(dashboard)/page-….js
.next/static/chunks/app/admin/(dashboard)/templates/page-….js

$ grep -rl "localhost:8080" .next/static
(không có kết quả)
```

Giá trị thật **được** nhúng vào bundle, và fallback `localhost:8080` **biến mất**. Nghĩa là cách
`ARG` + `ENV` trước `RUN npm run build` trong `frontend/Dockerfile` là đúng, và Z-10 — cái bẫy đắt
nhất của plan 15 — đã đóng với bằng chứng chứ không phải với lý lẽ.

Hai kiểm chứng còn lại của Step 7 (secrets guard chặn boot thật, và Flyway gặp Postgres thật) thì
**không** có đường thay thế nào ngoài Docker. **F-01, R-03, A-11 vẫn mở.**

---

## Phát hiện

> Cả hai finding MAJOR dưới đây là **lỗi trong plan tôi viết**, không phải lỗi của Antigravity.
> Nó implement đúng thứ được giao. Ghi rõ điều này vì hồ sơ theo dõi công cụ sẽ đọc sai nếu không.

### AB-01 — `.dockerignore` đặt sai chỗ nên vô tác dụng, và frontend image sẽ không build được (MAJOR)

Plan chỉ định **một** `.dockerignore` ở gốc repo. Nhưng `docker-compose.yml` khai:

```yaml
frontend:
  build:
    context: ./frontend
backend:
  build: ./backend
```

Docker đọc `.dockerignore` ở **gốc build context**, không phải gốc repo. Với context `./frontend`,
Docker tìm `frontend/.dockerignore` — không có. File ở gốc repo **không được đọc**.

Hậu quả không phải "hơi chậm", mà là build chết:

```dockerfile
RUN npm ci          # cài @next/swc-linux-x64-musl trong alpine
COPY . .            # đè node_modules của host lên
RUN npm run build   # ← chết ở đây
```

Kiểm host:

```
$ ls frontend/node_modules/@next/
env
swc-win32-x64-msvc

$ du -sh frontend/node_modules frontend/.next
560M    frontend/node_modules
188M    frontend/.next
```

Host chỉ có binary **win32**. `COPY . .` bê 560MB đó đè lên `node_modules` vừa cài đúng cho
Alpine, rồi `npm run build` không nạp được SWC. `docker compose build frontend` hỏng thẳng.

Đáng mừng là nó hỏng **ồn ào** chứ không âm thầm — nhưng nghĩa là image chưa từng build được như
plan viết, và không ai phát hiện ra cho tới khi có Docker.

Với backend nhẹ hơn: context `./backend` cũng không có `.dockerignore`, nên `backend/target/`
được gửi lên làm build context (chậm), nhưng Dockerfile chỉ `COPY pom.xml` và `COPY src`, nên
không có gì sai lọt vào image.

**Sửa:** tạo `frontend/.dockerignore` và `backend/.dockerignore`. Giữ file ở gốc repo cũng được
(nó phục vụ trường hợp sau này có ai build với context là gốc), nhưng nó không thay được hai file
kia.

### AB-02 — Không gì chứng minh guard được nối vào startup; gỡ một annotation là A-08 mở lại im lặng (MAJOR)

Bốn test của `SecretsGuardTest` gọi `new SecretsGuard(env).verify()` **trực tiếp**. Chúng chứng
minh *logic* đúng. Không cái nào chứng minh cái class ấy có chạy lúc ứng dụng khởi động.

Tôi chạy hai mutation ngoài plan:

| # | Revert gì | Kết quả |
|---|---|---|
| MA | Bỏ `@Component` khỏi `SecretsGuard` (không còn là bean, `@PostConstruct` không bao giờ chạy) | **XANH — 135/135, 0 failures** |
| MB | Bỏ `@PostConstruct` (bean tồn tại nhưng `verify()` không ai gọi) | **XANH — 135/135, 0 failures** |

Nghĩa là xoá một dòng annotation thì **A-08 mở lại hoàn toàn** — production quay về chạy bằng
`dev-only-analytics-secret-change-me` đang nằm công khai trong repo — và toàn bộ 135 test vẫn
xanh, review nào chỉ nhìn số test cũng sẽ cho qua.

Đây đúng khuôn **R-09** đã nằm sẵn trong bảng finding từ plan 03b: *"Test job không chứng minh
`@EnableScheduling` còn đó"*. Cùng một lỗ, cùng một dạng, ở một tính năng khác. R-09 lúc đó được
hoãn; lần này hậu quả nặng hơn nhiều vì nó là hàng rào duy nhất chặn deploy bằng secret công khai.

**Cách sửa rẻ nhất:** một `@SpringBootTest` khẳng định context có bean `SecretsGuard` —
`assertThat(context.getBean(SecretsGuard.class)).isNotNull()` — bắt được MA. Bắt MB thì cần một
test kích hoạt profile `prod` và kỳ vọng context **không** khởi động được; đắt hơn, vì profile
`prod` kéo theo cấu hình DB thật. Đề xuất: làm cái bắt MA ngay (rẻ, và MA là đường hỏng dễ xảy ra
hơn — ai đó dọn import), ghi MB thành finding mở cho tới khi có Docker.

### AB-03 — `@PostConstruct` trên method trả `boolean` (INFO)

JSR-250 nói method `@PostConstruct` **phải** trả `void`. Spring không cưỡng chế — nó gọi qua
reflection và bỏ qua giá trị trả về, điều mà 135 test xanh đã chứng minh (mọi `@SpringBootTest`
đều khởi động context có bean này).

Nó trả `boolean` vì các unit test cần một giá trị để khẳng định. Chạy được, nhưng dựa vào chỗ
Spring dễ dãi hơn đặc tả. Nếu về sau đổi sang một container khác, hoặc Spring siết lại, nó gãy.
Sạch hơn là tách làm hai: `verify()` trả `boolean` cho test gọi, và một method `void`
`@PostConstruct` gọi `verify()`.

Ghi nhận, không sửa gấp — đây cũng là thứ plan tôi viết ra.

### AB-04 — Bỏ bước commit, lần thứ năm (quy trình)

Step 8 không được thực hiện; 9 file nằm untracked khi tôi tiếp nhận. Trước đó: lượt 03c, 07 lần 2,
08 lần 1, 12 lần 1. Không ảnh hưởng chất lượng code, nhưng nó có nghĩa là **không bao giờ được
kết luận "xong" bằng cách nhìn `git log`** — phải `git status` trước.

---

## Điều làm tốt

- **Khai báo Step 7 trung thực.** Nó không chạy được và nó nói thế, thay vì tick checkbox rồi im.
  Đây là hành vi khó yêu cầu nhất ở một công cụ tự động, và là lần thứ tư Antigravity tự báo một
  điều bất lợi cho chính nó (trước đó: M5 xanh ở plan 07, R-14 còn mở ở plan 10, M1 xanh ở plan 09).
- **Giữ nguyên ba chỗ dễ bị "sửa cho gọn"**: `NEXT_PUBLIC_API_BASE_URL` là build arg chứ không
  phải `environment:`; service có **cả** `image:` lẫn `build:`; và `JWT_REFRESH_SECRET` **không**
  xuất hiện. Cả ba đều trông như thiếu sót nếu đọc nhanh, và cả ba đều là quyết định có lý do ghi
  trong plan.
- **`npm ci` chứ không `npm install`**, `USER app` không chạy root, `EXPOSE` đúng cổng.
- **Lượt 2 sau một lượt 0/8.** Giao lại kèm điều chỉnh (dùng `-Dtest=SecretsGuardTest` thay vì cả
  suite cho vòng đỏ/xanh) và lần này ra kết quả.

---

## Kết luận

**VERDICT: PASS có điều kiện — ship được, nhưng plan 16 phải mở bằng AB-01 và AB-02.**

135/135 backend, 42/42 frontend, build sinh standalone, và Z-10 đóng bằng bằng chứng grep trên
bundle thật. A-08 **đóng về logic** nhưng **chưa đóng về lưới an toàn** (AB-02).

Điều phải nói rõ: **image chưa từng được build** (AB-01 nói nó sẽ hỏng), và **Step 7 chưa chạy**.
Nên plan 15 ở trạng thái "code đã viết, chưa vận hành" — đúng lựa chọn số 2 trong ba lựa chọn
STATUS đã đặt ra. F-01, R-03, A-11 vẫn mở.

| Finding | Mức | Xử lý |
|---|---|---|
| **AB-01** | MAJOR | **Plan 16 Task 0** — thêm `frontend/.dockerignore` + `backend/.dockerignore`. Lỗi của plan 15, không phải của người implement |
| **AB-02** | MAJOR | **Plan 16 Task 0** — `@SpringBootTest` khẳng định bean `SecretsGuard` tồn tại; MA phải đỏ |
| AB-03 | INFO | Tách `void` `@PostConstruct` gọi `verify()` khi chạm lại |
| AB-04 | — | Quy trình: luôn `git status` trước khi tin `git log` |
| ~~A-08~~ | MAJOR khi deploy | **Đóng về logic** — `SecretsGuard` + 4 test. Nhưng xem AB-02 trước khi gạch hẳn |
| ~~Z-10~~ | MAJOR | **Đã đóng** — xác nhận bằng grep trên `.next/static` |
| ~~Z-11~~ | MAJOR | **Đã đóng** — `condition: service_healthy` + healthcheck cho cả hai |
| ~~Z-12~~ | MINOR | **Đã đóng** — `JWT_REFRESH_SECRET` không còn |
| ~~Z-13~~ | MINOR | **Đã đóng** — `SMTP_*` được truyền |
| ~~Z-14~~ | MINOR | **Đã đóng** — `npm ci` + `output: "standalone"` |
| **F-01, R-03, A-11** | — | **Vẫn mở.** Chỉ Step 7 đóng được, và Step 7 cần Docker |
