# Code review — plan 41 (event site), Task 2+3: **PASS sau vá kit**

**Ngày:** 2026-09-21
**Commit:** `5c287f5` (Task 1 của tôi), `71093d5`, `73f0156` (lượt giao), + bản vá kit của tôi
**Kết quả:** event **7/7 + build gate ✓**, education **5/5 + build gate ✓**, kit **47/47**.
Ba lỗi phát hiện được đều nằm ở `template-kit`, không phải ở lượt giao.

## Ba bài học từ plan 40 — áp đúng 7/7

Tôi đưa thẳng chúng vào handoff, và lượt giao giữ đủ:

| | |
|---|---|
| `oxc.jsx.runtime: 'automatic'` | ✅ |
| `resolve.dedupe: ['react','react-dom']` | ✅ |
| `@types/node` ghim `22.20.4` | ✅ |
| `exclude: ['scripts/**']` + test script tách hai runner | ✅ |
| `layout.tsx` dùng `variable:`, **0** lần `.className` | ✅ |
| `build-gate.test.mjs` import `../../../` | ✅ |

Đây là lần đầu một lượt giao không lặp lại lỗi nào của site trước. Chi phí phát hiện ở plan 40 đã
thu hồi được.

## B-01 (CHẶN) — năm component nữa gắn handler mà thiếu `"use client"`

    Error: Event handlers cannot be passed to Client Component props.
      {type: "button", onClick: function onClick, children: ...}

`PricedItemGrid` gắn `<button onClick>` bất cứ khi nào có `ctaLabel`, nên prerender của trang chết.
Quét cả kit theo **handler** (hôm qua tôi mới quét theo **hook**) ra thêm năm cái:
`CartDrawer`, `CompareTray`, `KanbanBoard`, `PricedItemGrid`, `SavedItemsPanel`.

Cùng một gốc với ba cái hôm qua: **kit chưa bao giờ được biên dịch bên trong một app Next**, nên cả
nhóm dùng hook lẫn nhóm gắn handler đều thiếu directive. Lần này tôi quét trước thay vì chờ site
thứ 12 phát hiện.

## B-02 (CHẶN) — `useLocalCollection` không thể báo lỗi ghi

Đây là lý do site education chỉ `console.error` được, và là lý do test "hiện thông báo lỗi" của
site này đỏ dù component **có** `try/catch` và thậm chí có probe.

`writeStorage` chạy **bên trong updater của `setItems`**. Updater của React thực thi khi React xử lý
cập nhật — **sau khi `try/catch` của caller đã thoát** — nên throw lọt ra ngoài mọi call site. Updater
còn bắt buộc phải thuần khiết, mà StrictMode gọi nó hai lần, tức ghi hai lần.

Đã sửa: mutator tính giá trị kế tiếp từ một ref rồi **ghi đồng bộ trong stack của caller, trước
`setState`**. Ghi hỏng thì state không đổi → UI không hiện trạng thái "đã lưu" giả, và handler bắt
được lỗi.

Kèm hai chỗ nhỏ cùng file: `readStorage` để `getItem` ngoài `try` (Safari private ném ngay ở bước
đọc — cái này *nên* nuốt, vì store không đọc được chỉ nghĩa là chưa có dữ liệu); và write lúc seed
khi mount cũng nuốt, vì một lần ghi hỏng ở lần ghé đầu không được phép giết cả trang.

## B-03 (CHẶN) — barrel không export type nào

    Type error: Module '"@portfolio/template-kit"' has no exported member 'TimelineEntry'.

Barrel export 15 component nhưng **không một type item/prop nào** ngoài `TemplateTheme`. Site không
type nổi `data/seed.ts` theo shape mà component thật sự nhận.

Education không dính vì nó **tự khai `interface Course` riêng** — và đó đúng là kiểu trôi dạt âm
thầm mà lỗ hổng này gây ra: hai định nghĩa song song, không gì buộc chúng khớp nhau.

Đã export toàn bộ type item/prop. Thuần additive, không import nào phải đổi.

## Xác minh

| | |
|---|---|
| event | 7/7, build gate ✓, static export |
| education (hồi quy sau khi kit đổi) | 5/5, build gate ✓ |
| template-kit | 47/47 |
| Font event | 3 biến, 50 `@font-face`, **subset `u+1ea0` có mặt**, `lang="vi"` |

## Ghi chú

Ba lỗi trên đều **không thể** bị 47/47 của kit bắt được: vitest render component trực tiếp và không
bao giờ đẩy chúng qua một bản build Next, cũng không chạy chúng trong cây server-component. Đó là lỗ
hổng ở tầng chiến lược test của plan 30, không phải test viết ẩu. Muốn đóng thật thì kit cần một
smoke build Next trong CI.
