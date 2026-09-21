# Code review — plan 44 (nonprofit site), Task 2+3: **PASS, lượt sạch nhất của chuỗi site**

**Ngày:** 2026-09-21
**Commit:** `5615cba` (Task 1 của tôi), `2b035e1`, `1d5bf52` (lượt giao)
**Kết quả:** nonprofit **6/6 + build gate ✓ ngay lần chạy đầu**. Không phải sửa một dòng test nào.

## Lần đầu không có lỗi test

Ba site liền trước (42, 43, và một phần 41) đều có cùng một loại lỗi: test truy vấn toàn trang trong
khi cùng một mẩu chữ xuất hiện ở hai nơi. Tôi đưa hẳn câu đó vào handoff lần này — *"dùng
`within(screen.getByRole(...))` cho bất cứ thứ gì cũng xuất hiện trong một nút hay tiêu đề"*.

Kết quả: test tự mở đầu bằng

```ts
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
...
return within(screen.getByRole('complementary', { name: /running total/i }));
```

Chi phí chẩn đoán ở ba site trước đã thu hồi được. Đây là bằng chứng rõ nhất từ đầu chuỗi rằng
**đưa bài học vào lệnh giao thì rẻ hơn nhiều so với để nó tái phát rồi sửa.**

## Checklist 6 mục — 6/6

Cộng thêm: `FooterLink` được import từ barrel của kit, tức nó dùng đúng các type tôi bổ sung ở plan
41 thay vì tự khai lại — đúng mục đích của bản vá đó.

## Điểm liêm chính — dòng công bố số liệu

Đây là chỗ tôi theo sát nhất, vì nó dễ bị làm mềm mà không ai nhận ra. Spec buộc copy của chính
section phải nói rõ số liệu là ví dụ minh hoạ cho một tổ chức hư cấu; stylesheet của tôi cố ý render
nó **cỡ chữ thân bài, tương phản đầy đủ**.

Kết quả, nguyên văn trong trang:

> These are illustrative example figures for a fictional organisation, authored for this demo
> scaffold only, and are not actual claims about any real charity.

Không hedging, không thu nhỏ, không đẩy xuống footnote. Và kiểm ở **HTML xuất ra** chứ không chỉ ở
JSX: `grep 'illustrative example figures' out/index.html` → **1**. Nó thật sự tới được người đọc.

## Tự kiểm

| | |
|---|---|
| Test | **6/6**, build gate ✓ |
| Font | 2 biến, 14 `@font-face`, subset `u+1ea0` có, `lang="vi"` |
| Anchor footer | `#programs`, `#impact`, `#pledge` — cả ba có id thật, 0 link chết |
| Xử lý lỗi | `try/catch` + thông báo nhìn thấy được ở cả hai handler |

## Bẫy môi trường — lần thứ tư, và giờ đã thành quy luật

Binary lần này **đúng** 20.796.928 B, nhưng lockfile lại hỏng: **219/256 gói thiếu `resolved`**.

Bốn lần liên tiếp, bốn thư mục site khác nhau. Không còn là ngẫu nhiên. Tổng kết đến giờ:

| Site | Binary | Lockfile |
|---|---|---|
| education | cụt | (không kiểm) |
| wedding | cụt | 206/233 hỏng |
| fitness | đúng | 222/280 hỏng |
| nonprofit | đúng | 219/256 hỏng |

Lockfile hỏng **mọi lần**; binary thì thỉnh thoảng. Nghĩa là bước bắt buộc sau mỗi `npm install`
trong một site mới là sinh lại lockfile, chứ không phải chỉ kiểm rồi hy vọng.

## Còn mở

Dòng công bố, thông báo lỗi, và nhãn giao diện đều bằng **tiếng Anh** trên một trang `lang="vi"`.
Cộng với các chuỗi hardcode trong kit, đây vẫn là quyết định treo ở tầng chương trình.
