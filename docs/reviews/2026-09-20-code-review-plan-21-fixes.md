# Code review — bản sửa F-01 + F-02, lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `e65bd7d` (F-01), `3e8dfb1` (F-02)
**Kết quả:** cả hai lỗi đã đóng, xác minh bằng chính phép thử đã chứng minh chúng.
**64/64 test**, build xanh. Ba điểm sạch sẽ ghi lại, không chặn ship.

## F-01 — đóng, kiểm bằng cùng một probe

`submitLead` giờ bọc `fetch` trong `try/catch`, trả `{ ok: false, reason: "network" }`; `"network"`
đã vào union; `ERROR_COPY` có dòng tiếng Việt 3 phần đúng giọng ba dòng anh em.

Chạy lại **đúng probe** đã dùng để chứng minh bug (mock `fetch` reject `TypeError`):

| | Trước `e65bd7d` | Sau |
|---|---|---|
| Nút | `Đang gửi…` | **`Gửi yêu cầu tư vấn`** |
| Nút disabled | `true` | **`false`** |
| `role="alert"` | `(none)` | **"Không gửi được yêu cầu. Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."** |
| Ô nhập disabled | `true` | **`false`** |
| Vitest | `Errors 1 error` | **không còn dòng nào** |

Unhandled rejection từ `leadClient.ts:7` → `ContactForm.tsx:26` đã biến mất. Form hồi phục được,
người dùng đọc được lý do và bấm gửi lại được.

## F-02 — đóng

`frontend/app/contact-form.css` tồn tại, `@import` vào `globals.css` đúng chỗ (trên `@tailwind`).
Kiểm ở CSS bundle thật mà trình duyệt tải, không phải chỉ đọc file:

    focus-visible trong bundle : 1
    dùng --color-focus         : 1
    outline:none               : 0

`--color-focus` từ chỗ **định nghĩa rồi bỏ không** giờ đã được dùng — đúng mục đích token sinh ra.
Không chỗ nào tắt outline. Class render đúng trên trang.

---

## Ba điểm sạch sẽ — ghi lại, không chặn

### C-01: `!important` × 4, và nguyên nhân gốc nằm chỗ khác

Hai rule hover phải dùng `!important`:

```css
.contact-form-input:hover { border-color: var(--color-neutral) !important; }
```

Không phải tuỳ tiện — nó **buộc phải thế**, vì `ContactForm.tsx` đặt màu bằng inline `style`:

```tsx
style={{ border: "1px solid var(--color-rule)", background: "var(--color-paper)", ... }}
```

Inline style thắng mọi class selector, nên CSS không có đường nào khác. Đây chính là hệ quả của
điều plan 21 tự nhận: đặt màu inline thì pseudo-class không diễn đạt được.

Cái giá: từ giờ **mọi** style tương lai trên các phần tử này cũng phải `!important`. Cách sạch là
chuyển `border`/`background`/`color` từ inline `style` sang chính `contact-form.css`. Không làm bây
giờ — đó là refactor rộng hơn phạm vi bản sửa, và nên gộp vào lượt dọn CSS của landing page.

### C-02: 7 selector cho việc 1 selector làm được

Nút mang **hai** class (`contact-form-button contact-form-submit`) và textarea mang hai
(`contact-form-textarea contact-form-input`), rồi CSS liệt kê cả class lẫn descendant:

```css
.contact-form-button:focus-visible,
.contact-form-submit:focus-visible,
.contact-form button:focus-visible { … }
```

Ba selector cho cùng một nút. Riêng nhóm descendant (`.contact-form input/textarea/button`) đã phủ
hết mọi phần tử, nên bốn selector theo class là thừa hoàn toàn. Rút gọn được về một dòng
`.contact-form :is(input, textarea, button):focus-visible`.

Không sai, chỉ là nhiều thứ phải sửa khi đổi.

### C-03: hover vẫn ăn trên ô đang bị khoá

Rule nút có `:not(:disabled)`, rule input **không**:

```css
.contact-form-input:hover { border-color: … }        /* thiếu :not(:disabled) */
.contact-form-button:hover:not(:disabled) { … }      /* có */
```

Trong lúc gửi, cả bốn ô đều `disabled` nhưng rê chuột lên vẫn đổi viền — gợi ý sai rằng ô còn tương
tác được. Lệch với chính rule nút ngay bên dưới.

---

## Ship

Hai commit đúng, đã push. Landing page (plan 19 → 21) coi như xong về mặt chức năng.
C-01 nên gộp vào một lượt dọn CSS trước khi lên production.
