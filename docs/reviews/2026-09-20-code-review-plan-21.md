# Code review — plan 21 (Services + Contact), lượt 1

**Ngày:** 2026-09-20
**Commit:** `751f7d3`, `f39afd3`, `4e2bceb`
**Kết quả:** **3/3 task, đúng phạm vi, 62/62 test.** Implement trung thành với plan.
**Hai finding đều là lỗ hổng của plan**, không phải lỗi của lượt giao — một trong đó là bug thật
người dùng gặp được.

## Implement

7 file, 281 dòng thêm, `page.tsx` chỉ +14 (nội dung plan 20 còn nguyên).
`package.json` / `package-lock.json`: **không đụng**.

Ba ràng buộc của lượt giao đều giữ, kể cả cái tinh tế nhất:

| Ràng buộc | Kết quả |
|---|---|
| `ServicesSection.test.tsx` có docblock jsdom | ✅ |
| `ContactForm.test.tsx` có docblock jsdom | ✅ |
| `leadClient.test.ts` **không** có docblock (test hàm thuần) | ✅ |
| `leadClient.ts` import `API_BASE` thay vì khai lại | ✅ |
| Giữ `id="templates"` + carousel + Decision (j) | ✅ |

`reason` của `submitLead` là union `"rate-limited" | "server-error" | "validation"`, khớp **chính
xác** ba key của `ERROR_COPY` — không có đường nào render `<p role="alert">` rỗng. Token
`--space-2xs` có thật.

---

## F-01 (MAJOR) — backend chết thì form đứng cứng vĩnh viễn

`leadClient.submitLead` không bọc `fetch` trong `try/catch`:

```ts
const res = await fetch(`${API_BASE}/api/public/leads`, { ... });
if (res.ok) return { ok: true };
```

`fetch` **reject** (backend tắt, DNS hỏng, CORS) chứ không trả status. Khi đó `await submitLead(...)`
trong `handleSubmit` ném ra ngoài, `setStatus("error")` **không bao giờ chạy**, và form kẹt ở
`"loading"`.

Tôi không suy luận — tôi chạy thử, mock `fetch` reject `TypeError("Failed to fetch")`:

    BUTTON TEXT    : Đang gửi…
    BUTTON DISABLED: true
    ALERT PRESENT  : (none)
    INPUT DISABLED : true

Vitest báo `Errors 1 error`, stack đi từ `leadClient.ts:7` → `ContactForm.tsx:26`.

Người dùng thấy: nút "Đang gửi…" xám vĩnh viễn, bốn ô nhập khoá cứng với nội dung họ vừa gõ mắc kẹt
bên trong, **không một dòng báo lỗi**, không cách nào thử lại ngoài F5.

Trớ trêu: đây đúng là kịch bản dự án đã ra quyết định ở chỗ khác. Decision (j) bắt trang phải lên
được khi backend chết — và trang **có** lên, review plan 20 đã xác minh. Nhưng cái form trên trang
đó thì chết.

**Vì sao lượt giao không sai:** "8 state" trong plan là **trạng thái tương tác UI**
(default/hover/focus-visible/active/disabled/loading/error/success), không phải failure mode. Plan
21 không chỗ nào nhắc `fetch` reject, network error, hay `try/catch` trong `leadClient`. Ba test của
`leadClient` đều mock `fetch` **resolve** kèm status. Không test nào chạm nhánh reject.

Đây là lỗ hổng tôi bỏ sót ở lượt rà plan 21.

## F-02 (MINOR) — `:focus-visible` chưa từng được làm, và plan tự biết

Self-Review Notes của plan 21, dòng 478, tự khai:

> default/hover/focus-visible covered by native input styling + `:focus-visible` (**to be added at
> the CSS layer**, not inline `style` … a `contact-form.css` partial using `var(--color-focus)` for
> `:focus-visible` outlines **should be added before this ships to production**)

Nhưng **không task nào trong plan tạo file đó**, nên nó không được tạo:

    $ ls frontend/**/contact-form.css      -> không có
    $ grep -rn "color-focus" frontend/      -> không dùng ở đâu cả

`--color-focus` là token tồn tại riêng cho việc này và hiện không ai dùng. Inline `style` không diễn
đạt được pseudo-class, nên 2 trong 8 state (hover, focus-visible) thực tế **không được implement** —
plan đếm chúng là "covered" rồi tự phủ nhận trong cùng một câu.

Không vỡ gì: không chỗ nào đặt `outline: none`, nên vòng focus mặc định của trình duyệt vẫn còn. Chỉ
là form không có style focus riêng như thiết kế đòi.

---

## Ship

Ba commit đúng và đã push — chúng implement plan trung thực, và F-01/F-02 là thiếu sót ở tầng plan.
Cả hai cần một lượt sửa riêng trước khi landing page coi là xong.
