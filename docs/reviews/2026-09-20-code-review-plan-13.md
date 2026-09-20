# Code Review — Plan 13 (admin login + middleware guard)

**Ngày:** 2026-09-20
**Phạm vi:** commit `77ede20` (Task 1), `9ed973b` (Task 2)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-13-admin-auth-middleware.md` (bản viết lại
sau `docs/reviews/2026-09-20-plan-review-13.md`)
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–6 | **Xong**, kể cả commit |
| Task 2, step 1–14 | **Xong**, kể cả commit |
| `npx vitest run` | **29/29 PASS** (15 → 29, đúng con số plan dự đoán) |
| `npm run build` | Thành công; middleware compile 34.1 kB |
| Phạm vi | **9 file, 0 file backend**, không đẻ thêm plan/spec/thư mục lạ |
| Cây làm việc sau khi chạy | Sạch |

**Đây là lượt tốt nhất của Antigravity trên dự án này.** Làm đủ 20 step, hai commit riêng đúng như
plan chia, báo cáo mutation chính xác từng con số, và không phát sinh một dòng nào ngoài phạm vi.

### Mutation check — tôi tự chạy lại cả bốn

| # | Revert gì | Antigravity báo | Tôi chạy lại |
|---|---|---|---|
| M1 | Đảo `!hasValidSession` thành `hasValidSession` | RED (4 failed, 1 passed) | **ĐỎ — 4 failed / 29** ✅ khớp |
| M2 | Bỏ early return `pathname === LOGIN_PATH` | RED (1 failed, 4 passed) | **ĐỎ — 1 failed / 29** ✅ khớp |
| M3 | `hasValidSession` → `return Boolean(cookieValue)` | RED (3 ở auth + 1 ở middleware) | **ĐỎ — 4 failed / 29** ✅ khớp |
| M4 | `shouldRenderTexture` → `return true` | RED (2 failed, 1 passed) | **ĐỎ — 2 failed / 29** ✅ khớp |

Bốn con số khớp tuyệt đối. Lần thứ ba Antigravity báo mutation đúng khi kiểm lại — nhưng đó vẫn
không phải lý do để bỏ kiểm, xem M5/M6 bên dưới.

### Kiểm chứng runtime — thứ mà test và build đều không nói được

Plan cảnh báo `Buffer` có thể không tồn tại trong Edge runtime và cho sẵn đường lui `atob`.
Antigravity **giữ `Buffer`** và build xanh. Nhưng build xanh không chứng minh runtime: test chạy
trong Node (có `Buffer` thật, có `base64url`), còn middleware chạy trong sandbox Edge.

Tôi dựng `npm start` rồi bắn 7 request thật:

| Request | Kết quả | Đúng? |
|---|---|---|
| `/admin`, token `exp` tương lai | **404** | ✅ — cho qua. 404 là đúng, `app/admin/page.tsx` là của plan 14 |
| `/admin`, payload base64url **chứa ký tự `-`** | **404** | ✅ — chỗ base64 và base64url thật sự khác nhau, decode vẫn đúng |
| `/admin`, token hết hạn | **307** → `/admin/login` | ✅ |
| `/admin`, token rác `not-a-jwt` | **307** → `/admin/login` | ✅ — không ném, không 500 |
| `/admin`, token không có claim `exp` | **307** → `/admin/login` | ✅ |
| `/admin/login`, không cookie | **200** | ✅ — không có vòng lặp redirect |
| `/administrator`, không cookie | **404** | ✅ — matcher không rò (X-08) |

Kết luận: `Buffer.from(x, "base64url")` **hoạt động thật** trong Edge runtime của Next 15.5.25.
Quyết định giữ `Buffer` là đúng, và giờ có bằng chứng chứ không phải chỉ có build xanh.

---

## Phát hiện

### Y-01 — Trang login không có một dòng test nào, nên hai bản vá nặng nhất của vòng rà plan có thể revert im lặng (MAJOR)

Tôi chạy thêm hai mutation mà plan không yêu cầu:

| # | Revert gì | Kết quả |
|---|---|---|
| M5 | Bỏ nhánh `res.status === 429` (chính bản vá X-05) | **XANH — 29/29** |
| M6 | Bỏ dòng `setCookie(REFRESH_TOKEN_COOKIE, ...)` (chính bản vá X-01) | **XANH — 29/29** |

X-01 là finding **MAJOR nặng nhất** của vòng rà plan: không lưu refresh token thì phiên chết sau
15 phút, `POST /api/auth/logout` không gọi được, và mỗi lần login đẻ một token 7 ngày không thu
hồi được. Code hiện tại lưu đúng. Nhưng **xoá dòng đó đi thì không gì đỏ** — nghĩa là bản vá tồn
tại nhờ may mắn, không nhờ lưới an toàn.

Đây là lần thứ **tư** dự án gặp đúng khuôn mẫu này:

| Lần | Mã | Chỗ không có gì canh |
|---|---|---|
| 1 | **C-02** (plan 06) | Test sniffed-type không canh giá trị `mime_type` lưu xuống |
| 2 | **W-01** (plan 12 task 2) | `TemplateCarousel3D` không có test nào vì jsdom không có WebGL |
| 3 | **X-03** (rà plan 13) | `middleware.ts` không có test nào |
| 4 | **Y-01** (đây) | `app/admin/login/page.tsx` không có test nào |

**Lỗi này thuộc về plan, không thuộc về Antigravity.** Plan liệt kê rõ file test cho `auth.ts`,
`middleware.ts`, `templateTexture.ts` — và **quên** login page. Antigravity làm đúng những gì
được giao. Tôi là người viết plan đó, và tôi vá X-03 bằng cách thêm test cho middleware rồi để
lọt đúng cái lỗ tương tự ở màn ngay bên cạnh.

**Cách sửa rẻ nhất** (giao plan 14, cùng lượt với `adminFetch`), đúng công thức đã dùng cho W-01:
tách quyết định ra khỏi component thành hàm thuần, khỏi phải dựng React —

- `loginErrorMessage(status: number): string` → test 401 / 429 / 500 / 503.
- `persistSession(tokens: TokenDto): void` trong `lib/auth.ts` → test bằng stub `document.cookie`.
  Plan 14 đã có sẵn mẫu stub đó trong test của `adminFetch`, nên không tốn hạ tầng mới.

Sau đó M5/M6 sẽ đỏ.

### Y-02 — `res.json()` không kiểm gì, một response thiếu trường cho ra vòng lặp login câm (MINOR)

```ts
const { accessToken, refreshToken } = await res.json();
```

Không có kiểu, không có kiểm tra. Nếu response thiếu trường (hoặc trả `null`), cookie được đặt
thành chuỗi ký tự `"undefined"`. Rồi `hasValidSession` không decode nổi → coi như hết hạn →
middleware đá ngược về `/admin/login`. Người dùng nhập đúng mật khẩu, thấy form nhấp nháy rồi
quay lại form, **không một thông báo lỗi nào** — vì code đã đi qua nhánh `res.ok` thành công rồi.

Hôm nay không xảy ra: `TokenDto` là record hai trường, luôn trả đủ cả hai. Nhưng giá phòng thủ là
một câu `if` + một dòng `setError`, còn giá chẩn đoán khi nó xảy ra là lần mò giữa hai tầng.
Gộp vào lượt sửa Y-01.

### Y-03 — `15 * 60` chép tay từ `jwt.access-ttl-minutes: 15`, không gì canh cặp này (INFO)

`ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60` với comment `// matches jwt.access-ttl-minutes`. Comment
nói "matches" nhưng không có gì bắt buộc nó matches — đúng khuôn **D-02** (cặp
`spring.servlet.multipart.max-file-size` / `media.max-size-bytes`), thứ dự án đã phải đóng bằng
một test riêng.

Khác D-02 ở một điểm quan trọng: ở đây lệch **không gây lỗi**, vì `hasValidSession` đọc `exp`
thật trong token chứ không tin vào `max-age` của cookie. Đổi TTL backend mà quên sửa hằng số này
thì hậu quả xấu nhất là cookie chết sớm hơn hoặc muộn hơn token vài phút, và middleware vẫn quyết
định đúng. Tự giới hạn được, nên chỉ ghi nhận.

---

## Điều làm tốt

- **`shouldRenderTexture` trả type predicate `thumbnailUrl is string`, không phải `boolean` như
  plan viết.** Đây là lệch plan **bắt buộc phải lệch**: trong nhánh true, code gọi
  `<TextureMaterial url={template.thumbnailUrl} />`, mà `url` là `string`. Với chữ ký `boolean`
  của plan, TypeScript vẫn thấy `string | null` và `npm run build` sẽ đỏ ở bước type-check. Nghĩa
  là Antigravity đọc code xung quanh rồi sửa plan cho đúng, thay vì chép nguyên rồi nhét `!` để
  dập lỗi. Đây là loại phán đoán khó yêu cầu và dễ làm sai.
- **Giữ `Buffer` thay vì nhảy sang `atob` cho an toàn.** Plan cho sẵn đường lui và nó **không**
  dùng — đúng, vì đường lui chỉ cần khi build đỏ, và build không đỏ. Chọn `atob` khi không cần
  sẽ là thêm một lớp xử lý base64url thủ công không ai kiểm.
- **Báo cáo mutation kèm số test đỏ của từng cái, ở từng file.** Bốn con số, tôi kiểm lại bốn,
  khớp cả bốn. So với lượt 03c (bỏ mutation check, không báo) thì đây là hai thế giới khác nhau.
- **Comment giữ nguyên phần "why" của plan** — quyết định (c) (không verify chữ ký vì secret
  không được ra Edge runtime), quyết định (d) (không ném trong middleware), quyết định (f)
  (`HttpOnly` bất khả thi vì `JwtAuthFilter` chỉ đọc header). Không cắt bớt thành comment mô tả
  code.
- **Hai commit riêng đúng ranh giới plan chia**, `77ede20` chỉ có W-01 và `9ed973b` chỉ có auth.
  Bốn lượt gần đây Antigravity bỏ bước commit; lượt này không.

---

## Kết luận

**VERDICT: PASS — `77ede20`, `9ed973b`. Sẵn sàng ship.**

29/29 test, build xanh, 4/4 mutation đỏ khi tôi tự chạy lại, 7/7 nhánh middleware đúng khi bắn
request thật vào server đang chạy. Cả năm findings MAJOR của vòng rà plan (X-01…X-04, X-09) đều
đã được thực hiện đúng trong code.

Y-01 **không chặn ship**: hành vi hiện tại đúng, cái thiếu là lưới an toàn cho lần sửa sau. Nhưng
nó phải vào plan 14 chứ không được để trôi — lịch sử dự án cho thấy loại lỗ này không tự đóng.

| Finding | Mức | Xử lý |
|---|---|---|
| **Y-01** | MAJOR | **Plan 14** — tách `loginErrorMessage` + `persistSession` thành hàm thuần rồi test; M5/M6 phải đỏ |
| Y-02 | MINOR | Gộp vào lượt sửa Y-01 — kiểm `accessToken`/`refreshToken` trước khi đặt cookie |
| Y-03 | INFO | Ghi nhận; tự giới hạn vì `hasValidSession` đọc `exp` thật |
| ~~W-01~~ | MAJOR | **Đã đóng** — `77ede20`, M4 đỏ |
| ~~X-01~~ | MAJOR | **Đã đóng** — `9ed973b` lưu cả hai cookie (nhưng xem Y-01) |
| ~~X-02~~ | MAJOR | **Đã đóng** — `9ed973b`, M3 đỏ, kiểm thêm bằng request thật |
| ~~X-03~~ | MAJOR | **Đã đóng** — `middleware.test.ts` 5 ca, M1/M2 đỏ |
| ~~X-04~~ | MAJOR | **Đã đóng** — `API_BASE` export từ `apiClient.ts` |
| ~~X-05~~ | MINOR | **Đã đóng** về hành vi — nhưng M5 xanh, xem Y-01 |
| ~~X-07~~ | MINOR | **Đã đóng** — 404 ở `/admin` đã xác nhận bằng `curl`, đúng như plan mô tả |
| ~~X-08~~ | INFO | **Đã đóng** — `/administrator` trả 404, matcher không rò |
