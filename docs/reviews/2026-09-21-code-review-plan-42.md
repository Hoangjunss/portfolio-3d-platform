# Code review — plan 42 (wedding site), Task 2+3: **PASS**

**Ngày:** 2026-09-21
**Commit:** `63872e6` (Task 1 của tôi), `af95666`, `9889f6c` (lượt giao), + bản vá test của tôi
**Kết quả:** wedding **10/10 + build gate ✓**, event **7/7**, education **5/5**. Không hồi quy.

## Checklist 6 mục — đúng 6/6

`oxc.jsx.runtime` · `resolve.dedupe` · `@types/node` ghim `22.20.4` · `exclude: scripts/**` + test
tách hai runner · `build-gate` import `../../../` · `layout.tsx` dùng `variable:` (**0** lần
`.className`). Lượt thứ hai liên tiếp không lặp lại lỗi nào của site trước.

## Ba chỗ làm tốt hơn mức tôi yêu cầu

**Hydration của đồng hồ đếm ngược.** Tôi cảnh báo phải để prerender và lần render client đầu khớp
nhau. Nó render `--` cho tới khi `mounted`, kèm `suppressHydrationWarning`. Đúng cách.

**`computeCountdown` là hàm thuần nhận `now` làm tham số**, nên test được mà không phải giả lập
thời gian — 5 ca, gồm cả biên "đúng thời điểm" và "còn 1 giây".

**Múi giờ.** Tôi định ghi thành finding: một đồng hồ đếm ngược client-side sẽ chạy theo giờ máy
khách, nên khách ở múi giờ khác thấy sai. Kiểm lại: `weddingDateIso: '2026-12-20T17:00:00+07:00'` —
**có offset**, neo vào giờ địa điểm. Nghi ngờ của tôi không thành.

## Hai lỗi, cả hai nằm ở test chứ không ở code

**T-01 — assertion vỡ vì text trải qua hai phần tử.**

```
Unable to find an element with the text: /0 guests confirmed/i.
This could be because the text is broken up by multiple elements.
```

Markup là `<strong>0</strong> guests confirmed` — đúng thứ stylesheet của tôi đòi, vì con số cần
phần tử riêng để đặt cỡ và màu. `getByText` không khớp qua ranh giới phần tử. Đã đổi sang đọc
`textContent` của chính `.guest-count`.

**T-02 — giả lập storage không có tác dụng, nên test xanh giả.**

Test gán thẳng `window.localStorage.setItem = () => { throw ... }`. jsdom **bỏ qua** phép gán đó vì
method nằm trên `Storage.prototype`. Hệ quả: write không bao giờ ném, test đi trọn đường hạnh phúc
mà vẫn tự nhận là đang kiểm nhánh lỗi — loại test tệ nhất, vì nó báo an toàn ở đúng chỗ không an
toàn. Đã đổi sang `vi.spyOn(Storage.prototype, 'setItem')`, đúng cách site event đã làm.

Component thì đúng từ đầu: nó **hiện thông báo lỗi nhìn thấy được**, không chỉ `console.error` — đây
chính là điểm tôi yêu cầu site này làm tốt hơn education.

## Môi trường — lần thứ hai

Install hỏng đúng kiểu đã ghi trong memory: binary rolldown **4.371.456 B** thay vì **20.796.928 B**,
và `package-lock.json` sinh ra có **206/233 gói thiếu `resolved`**, nên `npm ci` cài đúng con số
không mà vẫn thoát 0. Xoá cả hai rồi `npm install` lại cho lockfile lành (1/176 — gói gốc) và binary
đủ kích thước.

## Còn mở — nợ Việt hoá, giờ đã thành hệ thống

Site đặt `lang="vi"`, tên cặp đôi tiếng Việt, footer tiếng Việt ("Ảnh cưới"), nhưng chuỗi giao diện
vẫn tiếng Anh: `"RSVP now"`, `"Send RSVP"`, `days/hours/minutes/seconds`, `"guests confirmed"`,
`"We're married!"`. Cộng thêm ba chuỗi **hardcode trong kit** mà site không sửa được:
`InquiryForm` có `"Message"`, `"Sent"`, `"Something went wrong"`; `SavedItemsPanel` có `"Remove"`.

Đây không còn là chuyện của một site. Hai chuỗi ở plan 24, hai ở plan 26, giờ thêm một loạt nữa —
và bốn chuỗi nằm trong kit thì **không site nào chữa được**. Cần một quyết định ở tầng chương trình:
hoặc kit nhận prop cho mọi nhãn, hoặc chốt rằng các site demo dùng tiếng Anh cho chrome.
