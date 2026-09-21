# Code review — plan 46 (construction site), Task 2+3: **PASS**

**Ngày:** 2026-09-21
**Commit:** `bddc972` (Task 1 của tôi), `d88f33b`, `d85fc8f` (lượt giao), + một bản vá một dòng
**Kết quả:** construction **6/6 + build gate ✓ ngay lần chạy đầu**. Không hồi quy: education 5/5,
event 7/7, wedding 10/10, fitness 7/7, nonprofit 6/6, travel 5/5.

## Lần thứ hai không phải sửa test nào

Hai bẫy truy vấn tôi đưa vào handoff đều được áp **trước**, không phải sau khi vỡ:

```ts
function escapeRegex(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\]/g, '\$&'));
}
return within(screen.getByRole('complementary', { name: /your requests/i }));
```

Cả hai đều là bài học phải trả giá ở travel (`new RegExp(seedTitle)` với tiêu đề chứa `+`) và ở ba
site trước đó (truy vấn không thu hẹp vùng). Chúng không tái phát.

Và bài học lớn hơn từ travel cũng được giữ: **`app/page.tsx` là server component** — không có
`'use client'`, nên hero, gallery, timeline, footer đều được render sẵn. Kiểm ở HTML xuất ra:
`split-label` có mặt trong `out/index.html`.

## Checklist 6/6 + hook Split Studio đầy đủ

Ba section `split`, mỗi section có `split-text` + `split-proof` + `split-label`; `quote-controls`
với `aria-pressed`; masonry `column-count` đi được vào CSS xuất ra.

## S-01 (MINOR, đã vá) — đảo chiều không xen kẽ

Ba khối diptych lần lượt là `projects` (thường) → `process` (thường) → `services` (đảo).

Hai khối đầu nằm **cùng chiều**. Split Studio được định nghĩa bằng việc pairing **đảo chiều xuống
dưới trang**, và trong chính commit Task 1 tôi đã viết rằng đó là thứ ngăn bố cục hai cột đọc ra như
template. Với ba khối, xen kẽ đúng là thường → đảo → thường.

Đã chuyển `data-flip="true"` từ `services` sang `process`. Một thuộc tính, và không test nào bắt được
— đây là loại lệch chỉ lộ ra khi đối chiếu với định nghĩa của macrostructure chứ không phải với một
assertion.

## Bẫy install — lần thứ sáu

Lại không có lockfile và `node_modules` dở dang khi tôi nhận. Cài sạch cho lockfile 1/176 và binary
20.796.928 B. Sáu site, sáu lần phải làm lại — đây không còn là sự cố mà là một bước của quy trình.
