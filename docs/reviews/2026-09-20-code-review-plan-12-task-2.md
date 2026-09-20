# Code Review — Plan 12 Task 2 (carousel) + phạm vi phát sinh ngoài yêu cầu

**Ngày:** 2026-09-20
**Phạm vi:** commit `1428981`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-12-3d-carousel.md`, Task 2
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 2, step 1–9 | **Xong**, sáu quyết định (f)–(l) đều được thực hiện |
| Step 10 (commit) | **Bỏ.** Tôi commit |
| `npx vitest run` | **15/15 PASS** (5 → 15) |
| `npm run build` | Thành công |
| Backend | Không đụng, đúng yêu cầu |

### Mutation check — tôi tự chạy cả năm

| # | Revert gì | Kết quả |
|---|---|---|
| M4 | sinh id mới mỗi lần gọi `getSessionId` | **ĐỎ** |
| M5 | bỏ lời gọi `PAGE_VIEW` | **ĐỎ** |
| M6 | trả `null` tới khi probe WebGL xong | **ĐỎ** — plan dự đoán có thể xanh, nhưng test canh đúng đường SSR |
| M7 | truyền sai `templateId` | **ĐỎ** |
| M8 | bỏ nhánh `thumbnailUrl` null | **XANH** ← xem W-01 |

---

## Phát hiện

### W-01 — `TemplateCarousel3D` không có test nào chạm tới, và một ca test hứa điều nó không kiểm (MAJOR)

M8 xanh. Truy ra lý do: ca `renders a card whose thumbnailUrl is null without throwing` — trong
file test còn ghi chú thẳng `// Test null thumbnail for Decision (i) and M8` — chạy trong môi
trường không có WebGL, nên `isWebGLAvailable()` trả false và component render **nhánh 2D**. Nhánh
null-thumbnail mà quyết định (i) nói tới nằm trong `TemplateCarousel3D`, và nó **không bao giờ
được chạy**.

Hệ quả rộng hơn: `components/TemplateCarousel.test.tsx` là file test duy nhất, và vì jsdom không
có WebGL nên **toàn bộ `TemplateCarousel3D` không có một dòng nào được test** — kể cả `Suspense`,
kể cả `useTexture`, kể cả nhánh màu thay ảnh.

Đây đúng khuôn mẫu **C-02** của plan 06: một ca test mang cái tên hứa hẹn hơn thân của nó. Lần đó
mất một vòng mutation mới lộ ra; lần này cũng vậy.

Code thì **trông đúng** — `template.thumbnailUrl ? <Suspense>...</Suspense> : <plane màu>` là
cách xử lý hợp lý. Vấn đề là không có gì chứng minh, nên một lần sửa bất cẩn sẽ âm thầm làm hỏng
carousel khi gặp ảnh 404.

**Cách sửa rẻ nhất:** tách quyết định nhánh thành một hàm thuần, ví dụ
`shouldRenderTexture(template): boolean`, rồi test hàm đó trực tiếp. Không cần mock R3F, không
cần renderer, và mutation M8 sẽ bắt được. Giao cho plan 13 task 1.

### W-02 — Phạm vi phát sinh ngoài yêu cầu: 10 plan mới, 2 spec mới, `tokens.css`, `.hallmark/` (cần người dùng quyết)

Handoff yêu cầu đúng một việc: Task 2, mười step, một commit, không đụng backend. Ngoài Task 2,
lượt này còn tạo ra — **và vẫn đang tạo thêm trong lúc tôi review**:

- 10 file plan mới `2026-09-20-19` đến `-28`
- 2 file spec mới (landing page UI, template design system)
- `frontend/tokens.css` (103 dòng, **không file nào import**)
- thư mục `.hallmark/`
- một mục mới chèn thẳng vào `docs/superpowers/STATUS.md`

**Nội dung thì không phải rác.** Nó chỉ ra một khoảng trống thật: bộ 18 plan gốc chỉ có 4 plan
frontend, và plan 14 tự thú trong Self-Review Notes rằng chỉ dựng 3/9 màn admin. Tôi kiểm ba
khẳng định nặng nhất của nó:

| Khẳng định | Kiểm chứng |
|---|---|
| Không có controller cho audit-logs / error-logs | **Đúng** — 11 controller hiện có, không có cái nào |
| `SettingsController` không có endpoint liệt kê | **Đúng** — chỉ `GET /{key}` và `PUT /{key}` |
| `MediaController` chỉ có POST | **Đúng** — đã xác nhận ở vòng review trước |
| `frontend/app/admin/` "hiện là thư mục con thường" | **SAI** — thư mục đó **không tồn tại**. Plan 14 chưa được implement; `frontend/app/` chỉ có `globals.css`, `layout.tsx`, `page.tsx` |

Khẳng định sai ấy đáng nói vì nó là "điểm chặn số 1" của roadmap mới, và nó được viết như thể mô
tả code đang có. Mối lo bên dưới — gắn nav công khai vào `app/layout.tsx` gốc sẽ rò rỉ sang
`/admin/**` — **vẫn hợp lệ** cho lúc plan 14 đáp xuống, nhưng nó là chuyện tương lai chứ không
phải hiện trạng.

**Đây là quyết định phạm vi, không phải lỗi kỹ thuật.** Mở rộng dự án từ 18 lên 28 plan là việc
của người chủ dự án. Tôi giữ lại toàn bộ (xoá đi là phá công sức có giá trị), commit riêng và ghi
rõ **chưa được review, chưa được duyệt**, và không plan nào trong 19–28 được giao đi trước khi rà
từng cái như mọi plan khác — bảy plan gần đây rà cái nào cũng ra lỗi sống.

---

## Điều làm tốt

- **`dynamic(() => import("./TemplateCarousel3D"), { ssr: false })`** — plan chỉ nói "2D render ở
  server, 3D là bản nâng cấp client". Cách này còn giữ luôn cho R3F và three.js không lọt vào
  bundle server, thứ plan không yêu cầu mà đúng.
- **`useRef` chặn `PAGE_VIEW` lặp** thay vì dựa vào mảng phụ thuộc rỗng của `useEffect` — đúng
  trong Strict Mode của React 19, nơi effect chạy hai lần ở dev.
- **`getSessionId` bọc `try/catch` quanh `sessionStorage`** — Safari private mode ném ở
  `setItem`, và khi đó trả `null` là đúng: không có id thì không gửi sự kiện, thay vì làm hỏng trang.
- **Comment ở `iframe` giải thích từng token bị loại** (`allow-top-navigation`, `allow-forms`,
  `allow-popups`, `allow-modals`), không chỉ liệt kê token được phép.
- **M6 đỏ** — plan dự đoán ca này có thể xanh vì khó canh đường SSR. Test được viết đủ chặt.

---

## Kết luận

**VERDICT: Task 2 PASS — `1428981`.**

15/15 test, build xanh, sáu quyết định đều được thực hiện và bốn trong năm mutation đỏ. Plan 12
xong cả hai task.

| Finding | Xử lý |
|---|---|
| **W-01** | **Plan 13 task 1** — tách `shouldRenderTexture` thành hàm thuần và test nó; hiện `TemplateCarousel3D` không có test nào |
| **W-02** | **Cần người dùng quyết**: nhận hay bỏ roadmap plan 19–28. Đã commit riêng, đánh dấu chưa review |
