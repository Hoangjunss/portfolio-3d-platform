# Code Review — Plan 14 (admin dashboard CRUD)

**Ngày:** 2026-09-20
**Phạm vi:** commit `fc7f518` (Task 1), `874bab2` (Task 2 + 3)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-14-admin-dashboard-crud.md` (bản viết lại
sau `docs/reviews/2026-09-20-plan-review-14-to-17.md`)
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–7 | **Xong**, kể cả commit |
| Task 2, step 1–4 | **Xong** |
| Task 3, step 1–9 | **Xong**, kể cả commit |
| `npx vitest run` | **42/42 PASS** (29 → 42, đúng con số plan dự đoán) |
| `npm run build` | Thành công; 4 route đúng URL |
| Phạm vi | **12 file, 0 file backend**, không đẻ thêm plan/spec |
| Cây làm việc sau khi chạy | Sạch |

Lượt thứ hai liên tiếp Antigravity làm đủ step, đúng phạm vi, hai commit đúng ranh giới plan chia.

### Mutation check — tôi tự chạy lại cả sáu

| # | Revert gì | Antigravity báo | Tôi chạy lại |
|---|---|---|---|
| M1 | `unwrapPage` bỏ nhánh envelope | RED | **ĐỎ — 1 failed** ✅ |
| M2 | `unwrapPage` fallback trả `body as T[]` | RED | **ĐỎ — 1 failed** ✅ |
| M3 | `adminFetch` trả `first`, không thử refresh | RED | **ĐỎ — 2 failed** ✅ |
| M4 | `adminFetch` refresh trong vòng lặp thay vì một lần | RED | **ĐỎ — 3 failed** ✅ |
| M5 | `loginErrorMessage` luôn trả "Invalid credentials" | RED | **ĐỎ — 3 failed** ✅ |
| M6 | `persistSession` bỏ kiểm token thiếu | RED | **ĐỎ — 1 failed** ✅ |

Sáu trên sáu. Lần thứ tư báo cáo mutation đúng khi kiểm lại.

### Kiểm chứng runtime — Z-02 là thứ chỉ nhìn thấy khi render thật

Build in ra 4 route đúng URL (`/admin`, `/admin/leads`, `/admin/login`, `/admin/templates`), tức
dấu ngoặc của route group không rò vào đường dẫn. Nhưng build **không** nói layout lồng thế nào,
mà đó chính là nội dung của Z-02. Dựng `npm start` rồi đọc HTML thật:

| Request | Số link `/admin/templates` trong HTML | Đúng? |
|---|---|---|
| `/admin/login`, **không cookie** | **0** — và có `autocomplete="current-password"` | ✅ Trang đăng nhập không thừa hưởng sidebar |
| `/admin`, token hợp lệ | 1 | ✅ |
| `/admin/leads`, token hợp lệ | 1 | ✅ |

Z-02 đóng, có bằng chứng render chứ không phải suy luận từ cấu trúc thư mục.

---

## Phát hiện

### AA-01 — Stub của test mô hình sai `document.cookie`, và code production bị bẻ cho vừa stub (MINOR)

Plan viết `readCookie` dùng `.find(...)`. Code giao về dùng `.findLast(...)`.

Tôi đổi về `find` rồi chạy suite:

```
× retries once through /api/auth/refresh after a 401, then replays the request
      Tests  1 failed | 41 passed (42)
```

Truy ra lý do. Cookie jar giả trong `adminApiClient.test.ts` **nối thêm**:

```ts
set cookie(v: string) {
  jar = `${jar}; ${v}`;
}
```

`document.cookie` thật thì **thay thế** cookie cùng tên + cùng path. Nên sau khi `adminFetch`
gọi `persistSession`, jar giả chứa cả `portfolio_access_token=stale` lẫn
`portfolio_access_token=new.a.b`; `find` nhặt cái cũ, `findLast` nhặt cái mới.

**Hành vi ở trình duyệt thì không đổi.** Mọi cookie của app đều đặt `path=/`, không bao giờ có
hai cookie trùng tên, nên `find` và `findLast` cho cùng kết quả. Đây không phải lỗi chức năng.

Vấn đề là **chiều phụ thuộc bị ngược**: test sai hình dạng, và code production đổi theo. Hai hệ
quả cụ thể:

1. `findLast` không có lý do nào nhìn thấy được trong code. Người sau đổi nó về `find` — lựa
   chọn tự nhiên hơn — sẽ thấy test đỏ vì một lý do **không liên quan gì tới trình duyệt**, và
   khả năng cao là sẽ đi sửa test thay vì hiểu ra.
2. Ca test "replay dùng token mới" hiện **đúng nhờ một tạo tác của stub**, không phải nhờ hành
   vi thật. Nó mang cái tên hứa hẹn hơn thứ nó thực sự kiểm — đúng khuôn C-02 / W-01 / X-03 /
   Y-01, lần thứ năm, chỉ là ở dạng nhẹ hơn.

**Sửa (giao plan tiếp theo chạm vào frontend):** cho stub thay thế theo tên như trình duyệt làm.
Rồi trả `readCookie` về `find`, và ca test sẽ chứng minh đúng thứ nó hứa.

### AA-02 — Ba màn, hai lưới hình dạng, một không (INFO)

`/admin/templates` và `/admin/leads` đi qua `unwrapPage`, nên dù backend trả gì thì màn cũng nhận
được mảng. Màn dashboard thì:

```ts
const parseSummary = (body: unknown) => body as Summary;
...
{data.topTemplates.map((t) => (
```

`as Summary` là lời khẳng định, không phải phép kiểm. `topTemplates` vắng mặt là `.map` ném —
đúng khuôn crash mà Z-03 sinh ra để chặn, chỉ khác là lần này ở tầng trường lồng thay vì tầng
thân response.

**Không có đường sống hôm nay:** `AnalyticsServiceImpl:78` lấy `topTemplates` từ
`analyticsEventRepository.topClickedTemplates(...)`, là query Spring Data khai kiểu trả `List` —
Spring Data không trả `null` cho kiểu đó. Nên `topTemplates` luôn có mặt.

Ghi lại vì sự bất đối xứng mới là thứ đáng ngại: hai màn có lưới, một màn không, và không có gì
trong code nói vì sao. Màn thứ tư (plan 22–27) rất dễ được viết theo màn không có lưới.

### AA-03 — `persistSession` ném từ trong `adminFetch` cho ra thông điệp lỗi sai (INFO)

Nếu `/api/auth/refresh` trả 200 với body thiếu trường, `persistSession` ném (đúng thiết kế, M6).
Nhưng nó ném **bên trong** `adminFetch`, throw thoát ra ngoài và rơi vào `.catch` của
`useAdminResource`, hiện `"Cannot reach the server."` — trong khi server vừa trả lời xong.

Nhỏ, nhưng đây đúng loại thông điệp làm người ta đi kiểm nhầm chỗ (mạng, DNS, firewall) cho một
lỗi hợp đồng API.

---

## Điều làm tốt

- **Route group đặt đúng ngay lần đầu.** `app/admin/(dashboard)/` với `login/` là anh em bên
  ngoài, và HTML render ra chứng minh trang đăng nhập không thừa hưởng sidebar. Đây là finding
  Z-02, thứ chỉ lộ ra khi đọc plan 13 và plan 14 cùng nhau.
- **`unwrapPage` được dùng cho cả hai màn danh sách**, kể cả màn templates nơi endpoint đã trả
  mảng phẳng sẵn. Plan không bắt buộc điều đó. Đúng: hai endpoint hai hình dạng là thứ sẽ trôi,
  và một hàm duy nhất chịu trách nhiệm thì màn thứ ba không phải nhớ lại.
- **`parse` được khai ở tầng module** (`const parseTemplates = ...` ngoài component), không phải
  inline trong lời gọi hook. Nếu inline thì mảng phụ thuộc của `useEffect` đổi mỗi lần render và
  màn sẽ fetch vô hạn. Plan có viết như vậy nhưng không giải thích vì sao; nó giữ đúng.
- **Báo cáo mutation liệt kê cả sáu**, và cả sáu khớp khi tôi chạy lại.

---

## Kết luận

**VERDICT: PASS — `fc7f518`, `874bab2`. Sẵn sàng ship.**

42/42 test, build xanh với 4 route đúng, 6/6 mutation đỏ khi tự chạy lại, và Z-02 được xác nhận
bằng HTML render thật chứ không phải bằng cấu trúc thư mục. Tám finding MAJOR/MINOR của vòng rà
plan 14 (Z-01…Z-08) đều đã được thực hiện, cộng Y-01 tồn từ plan 13.

Không finding nào chặn ship. AA-01 là nợ kỹ thuật thật nhưng không phải lỗi hành vi.

| Finding | Mức | Xử lý |
|---|---|---|
| **AA-01** | MINOR | Plan frontend kế tiếp — sửa stub cookie cho thay thế theo tên, rồi trả `readCookie` về `find` |
| AA-02 | INFO | Cân nhắc khi viết màn admin thứ tư (plan 22–27) |
| AA-03 | INFO | Gộp vào lượt chạm `adminFetch` tiếp theo |
| ~~Y-01~~ | MAJOR | **Đã đóng** — `fc7f518`, M5/M6 đỏ |
| ~~Z-01~~ | MAJOR | **Đã đóng** — `unwrapPage`, M1/M2 đỏ |
| ~~Z-02~~ | MAJOR | **Đã đóng** — route group, xác nhận bằng HTML render |
| ~~Z-03~~ | MAJOR | **Đã đóng** — `useAdminResource` kiểm `res.ok`, 401 đá về login (nhưng xem AA-02) |
| ~~Z-04~~ | MAJOR | **Đã đóng** — Y-01 nằm trong Task 1 |
| ~~Z-05~~ | MINOR | **Đã đóng** — `adminFetch` refresh đúng một lần, M3/M4 đỏ |
| ~~Z-06~~ | MINOR | **Đã đóng** — 0 file backend bị đụng |
| ~~Z-07~~ | MINOR | **Đã đóng** — cột Status "Active"/"Inactive" (U-03) |
| ~~Z-08~~ | INFO | **Đã đóng** — `<Link>` thay `<a href>` |
