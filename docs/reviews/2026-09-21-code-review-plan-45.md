# Code review — plan 45 (travel site), Task 2+3: **PASS sau ba bản vá**

**Ngày:** 2026-09-21
**Commit:** `b981b72` (Task 1 của tôi), `0c1bba8`, `6db4ea1` (lượt giao), + bản vá của tôi
**Kết quả:** travel **5/5 + build gate ✓**. Không hồi quy: education 5/5, event 7/7, wedding 10/10,
fitness 7/7, nonprofit 6/6.

## Checklist 6/6, và map giữ được tính trung thực

`<figure className="map-placeholder">` với `<figcaption>` lấy từ seed, **0** phần tử `<svg>`/`<path>`
— không ai vẽ một bản đồ giả cho đẹp. Đúng thứ tôi dặn: bịa hình một nơi không tồn tại cũng là bịa
nội dung.

## A-01 — cả trang bị kéo sang client vì một handler

`page.tsx` mở đầu bằng `'use client'`. Năm site trước **không site nào** như vậy:

    education   import { Hero, ItemGrid, Footer } ...
    event       import { Hero, Timeline, ... } ...
    wedding     import { Hero, PhotoGallery, Footer } ...
    fitness     import { ... }
    nonprofit   import { Hero, ItemGrid, StatBlock, Footer, ... }

Nguyên nhân: `handleBookingSubmit` được định nghĩa ngay trong `page.tsx` và truyền vào `InquiryForm`.
Không thể truyền hàm từ server component, nên cả file phải thành client — kéo theo hero, lưới phòng,
tiện nghi, map, footer đều thành JS phía client.

Spec dòng 59 nêu thẳng quy tắc: *"static content renders directly from imported seed data"*. Đây là
vi phạm quy tắc đó, và nó **không làm test đỏ** — chỉ làm site nặng hơn và render chậm hơn, im lặng.

Đã tách `BookingSection.tsx` (client) chứa form + handler, trả `page.tsx` về server component.
Kiểm ở HTML xuất ra chứ không phải ở source: tên resort, tiêu đề tiện nghi, chú thích map đều **có
sẵn trong `out/index.html`**, tức nội dung tĩnh thật sự được render trước.

## T-01 — `new RegExp(seedTitle)` với nội dung chứa ký tự regex

    Unable to find an element with the text:
    /Weekend Getaway Package — 2 nights, breakfast + spa voucher/

Test dựng pattern bằng `new RegExp(packageRoom.title)`. Tiêu đề trong seed có **`+`** ở
"breakfast + spa voucher", mà trong regex `+` là lượng từ — nên `t + s` được đọc thành "t, một hoặc
nhiều khoảng trắng, s", và dấu `+` thật không bao giờ khớp.

Loại lỗi này đặc biệt khó chịu vì nó **im lặng**: pattern vẫn hợp lệ, vẫn chạy, chỉ là không khớp.
Và nó phụ thuộc vào nội dung — đổi một dấu trong seed là test vỡ. Đã thêm hàm escape trước khi dựng
pattern từ nội dung.

## T-02 — subtotal và giá món trùng số

    Found multiple elements with the text: /5[.,]400[.,]000/

Khi giỏ chỉ có một mục thì subtotal **bằng đúng** giá mục đó, nên truy vấn theo chữ khớp hai lần
ngay cả khi đã thu hẹp vào panel. Đã đổi sang đọc thẳng phần tử `.trip-subtotal`.

Đây là biến thể mới của cùng một chủ đề: thu hẹp vùng vẫn chưa đủ khi **hai giá trị khác nhau về ý
nghĩa lại bằng nhau về chuỗi**.

## Đáng ghi nhận trong test

Ca kiểm lỗi storage không chỉ khẳng định có thông báo, mà còn khẳng định mục **không** được thêm vào
giỏ và panel vẫn ở trạng thái rỗng — tức nó kiểm đúng điều tôi yêu cầu: không có trạng thái "đã
thêm" giả khi ghi thất bại. Và nó dùng `within(card)` để bấm đúng thẻ, `tripPanel()` cho panel.

## Bẫy install — lần thứ năm

Lượt giao không chạy verify: không có `package-lock.json`, `node_modules` mới 94 mục (bản đủ ~170).
Tôi cài lại sạch → lockfile 1/176, binary 20.796.928 B.
