# Code review — plan 43 (fitness site), Task 2+3: **PASS sau vá kit**

**Ngày:** 2026-09-21
**Commit:** `ce424ee` (Task 1 của tôi), `25d9b6c`, `e21ce73` (lượt giao), + bản vá của tôi
**Kết quả:** fitness **7/7 + build gate ✓**, kit **48/48**, education **5/5**, event **7/7**,
wedding **10/10**. Không hồi quy.

## Checklist 6 mục — 6/6, và `RecordTable` đúng chỉ-đọc

Lượt thứ ba liên tiếp không lặp lỗi config của site trước. `RecordTable` được render **không**
`onEdit`/`onDelete` như tôi dặn — và kiểm ở tầng artifact: `grep '>Actions<' out/index.html` trả
**0**. Khách xem lịch lớp không bị mời bấm Sửa/Xoá.

## K-01 (CHẶN) — ràng buộc generic của `RecordTable` đẩy chi phí sang mọi site

    Type 'ScheduleEntry' is not assignable to type '{ [key: string]: unknown; id: string; }'.
      Index signature for type 'string' is missing in type 'ScheduleEntry'.

Kit đòi `T extends { id: string; [key: string]: unknown }`. Nghĩa là **mọi** site dùng bảng này
phải nhét index signature vào type nghiệp vụ của mình — và khi đã có `[key: string]: unknown` thì
mọi tên thuộc tính đều hợp lệ, tức tự vứt bỏ đúng thứ an toàn mà interface sinh ra để giữ. Một lỗi
kiểu gõ nhầm tên trường sẽ không còn ai bắt.

Đã đổi ràng buộc thành `T extends { id: string }` và ép kiểu tại **một** chỗ thật sự cần
(`row[column.key]`). Nới ràng buộc thì không thể phá caller sẵn có. Kit vẫn 48/48.

Hai lỗi kit liên tiếp ở cùng component này (cột Actions bắt buộc, rồi ràng buộc generic) đều có
chung nguồn gốc: **`RecordTable` được thiết kế cho đúng một ca dùng — bảng CRUD của admin — rồi
được liệt vào danh sách component dùng chung.** Ca dùng thứ hai là ca đầu tiên chạm vào nó.

## T-01 — cả ba lỗi test đều do truy vấn quá rộng

    Found multiple elements with the text: /sunrise hiit/i

Tên lớp xuất hiện **hai lần** trên trang: trong nút "Book Sunrise HIIT" và trong panel "My classes".
`getByText` toàn trang khớp cả hai. Tệ hơn, các assertion phủ định
`queryByText(...).not.toBeInTheDocument()` **không bao giờ có thể đúng**, vì sau khi huỷ đặt lớp thì
cái tên vẫn còn nguyên trong nút.

Đã thu hẹp mọi assertion vào `<aside aria-label="My classes">` bằng `within()`.

**Đây là site thứ ba liên tiếp mà mọi lỗi test đều nằm ở test, không ở component** — plan 42 là
`getByText` không khớp qua ranh giới phần tử và một mock storage không có tác dụng; plan 43 là truy
vấn không thu hẹp vùng. Khuôn chung: test viết như thể trang chỉ có một chỗ chứa dữ liệu đó.

## Bẫy môi trường — lần thứ ba

Binary native lần này **đúng** 20.796.928 B, nhưng `package-lock.json` sinh ra có **222/280 gói
thiếu `resolved`**. Hai triệu chứng tách rời nhau: lần này chỉ lockfile hỏng. Nếu commit nguyên
trạng thì `npm ci` trên CI sẽ cài đúng con số không mà vẫn thoát 0 — đúng thứ đã xảy ra ở wedding.
Đã xoá và sinh lại.

**Kết luận vận hành:** kiểm **cả hai** thứ sau mỗi `npm install` trong một site mới, vì chúng hỏng
độc lập:

    ls -l node_modules/@rolldown/binding-win32-x64-msvc/*.node    # 20796928
    node -p "const p=require('./package-lock.json').packages;const k=Object.keys(p);
             k.filter(x=>x&&!p[x].resolved&&!p[x].link).length+'/'+k.length"

## Ghi chú Task 1

Tôi đã tự bịa tên phòng tập ("Xưởng Thép") trong comment của `theme.ts` rồi tự gỡ trước khi commit —
spec không nêu tên nào ở phần seed data, và bịa nội dung là điều chính quy tắc authenticity cấm.
