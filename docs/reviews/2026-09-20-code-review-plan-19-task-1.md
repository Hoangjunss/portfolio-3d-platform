# Code review — plan 19, lượt 1: **1/4 task**

**Ngày:** 2026-09-20
**Commit:** `64291a3` (Task 1)
**Kết quả:** Task 1 **PASS, không finding nào**. Task 2, 3, 4 **không được làm**.

## Phạm vi thực tế so với phạm vi được giao

| Task | Nội dung | Trạng thái |
|---|---|---|
| 1 | Wire `tokens.css` + nạp 3 font + `lang="vi"` | ✅ xong, `64291a3` |
| 2 | `SiteNav.tsx` + test | ❌ **không có file** |
| 3 | `SiteFooter.tsx` + test | ❌ **không có file** |
| 4 | Mount cả hai vào `app/(public)/layout.tsx` | ❌ layout vẫn là pass-through |

`ls frontend/components/` chỉ có 5 file `TemplateCarousel*` / `TemplatePreviewModal` như trước.
Cây sạch, không stash, không branch khác — không phải "làm rồi quên commit", mà là **không làm**.

Đây là dạng đã ghi trong STATUS.md ở plan 04b lần 1 (chỉ làm task 1/8) và plan 08 lần 1 (6/14):
làm task đầu tử tế rồi dừng. Khác với các lượt 0/N ở chỗ phần đã làm **đúng và đủ**.

## Task 1 — kiểm từng khẳng định

Diff đúng ba file, 15 dòng thêm:

    frontend/app/globals.css | 6 ++++++
    frontend/app/layout.tsx  | 7 ++++++-
    frontend/tokens.css      | 6 +++---

| Khẳng định | Cách kiểm | Kết quả |
|---|---|---|
| Hallmark stamp không bị sửa | `git show` | diff chỉ chạm dòng 22-24 ✅ |
| `npm run build` xanh, không "Unknown subset" | chạy thật | xanh, không lỗi subset ✅ |
| Route table không đổi | build output | `/`, `/admin/*` nguyên vẹn ✅ |
| 42 test cũ không hỏng | `npx vitest run` | **42/42 PASS** ✅ |

## Kiểm runtime — phần quan trọng nhất

B-02 ở lượt rà plan là "font khai báo nhưng không bao giờ nạp", và **build xanh không chứng minh
được điều ngược lại** — đó chính là lý do bug đó sống sót tới giờ. Nên phải xem HTML và CSS thật:

    <html lang="vi" class="__variable_dbe48b __variable_f0ffd1 __variable_c29908">

| Kiểm | Kết quả |
|---|---|
| `lang` | `vi` ✅ (trước là `en` trên trang tiếng Việt) |
| 3 biến font gắn lên `<html>` | 3 class `__variable_*` ✅ |
| Biến trỏ vào family thật | `--font-body-face:"EB Garamond","EB Garamond Fallback"` ✅ |
| Font tự host, không gọi Google | 19 `@font-face`, file `.woff2` dưới `/_next/static/media/` ✅ |
| **Subset `vietnamese` thật sự có** | `unicode-range: u+0102-0103,…,u+1ea0-1ef9,u+20ab` ✅ |

Dòng cuối là dòng đáng tiền nhất. `u+1ea0-1ef9` là dải chứa gần hết nguyên âm có dấu tiếng Việt;
thiếu nó thì "Một xưởng, hai mươi bản thiết kế." đổi mặt chữ ngay giữa từ. Đã có.

> Ghi chú cho lần sau: lượt đầu tôi `grep` `U+0102-0103` viết hoa và **không thấy gì**, suýt ghi
> thành một finding sai. CSS của `next/font` viết thường. Grep dải unicode phải `grep -i`.

## Kết luận

`64291a3` ship được, độc lập với Task 2-4 — nó chỉ nạp font và token, không phụ thuộc component nào
chưa tồn tại. Đã push.

Task 2-4 cần giao lại. Plan không phải sửa gì: bản đã vá ở `173de96` vẫn đúng nguyên vẹn, vấn đề
chỉ là lượt giao dừng sớm.
