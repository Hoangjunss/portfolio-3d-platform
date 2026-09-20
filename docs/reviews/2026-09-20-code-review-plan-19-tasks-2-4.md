# Code review — plan 19, Task 2–4: implementation PASS, nhưng chạy thử lòi 3 lỗi plan

**Ngày:** 2026-09-20
**Commit:** `54ee278`, `27513db`, `4cebbda`
**Kết quả:** **3/3 task, đúng phạm vi, PASS.** Ba finding bên dưới **không phải lỗi của lượt giao** —
nó implement đúng plan từng dòng. Là lỗi của plan, chỉ lộ ra khi chạy thật.

## Implementation

    frontend/app/(public)/layout.tsx        | 17 ++++++++++++--
    frontend/components/SiteFooter.test.tsx | 19 ++++++++++++++++
    frontend/components/SiteFooter.tsx      | 34 ++++++++++++++++++++++++++++
    frontend/components/SiteNav.test.tsx    | 18 +++++++++++++++
    frontend/components/SiteNav.tsx         | 39 +++++++++++++++++++++++++++++++++

| Kiểm | Kết quả |
|---|---|
| 3 commit đúng ranh giới task | ✅ |
| `package.json` / `package-lock.json` bị đụng? | **KHÔNG** ✅ — đây là ràng buộc gắt nhất của lượt giao |
| Test dùng `renderToString`, không dùng testing-library | ✅ cả hai file |
| Không mount vào root `app/layout.tsx` | ✅ |
| Không đụng `app/admin/**` | ✅ |
| 16 token CSS được tham chiếu có thật trong `tokens.css` | ✅ 16/16 |
| Test suite | **46/46 PASS** (42 cũ + 4 mới) |
| Build + type-check | xanh, route table vẫn `/` |

### Phép thử đáng giá nhất: rò chrome sang admin

Đây là lý do plan 18b tồn tại, và lượt review 18b **không kiểm được** vì lúc đó layout còn rỗng.
Giờ có thật để rò:

| Request | `Xem template` | tagline footer |
|---|---|---|
| `GET /` | **1** | có |
| `GET /admin/login` | **0** | **0** |

Route group làm đúng việc. Đóng lại câu hỏi treo từ review 18b.

---

## Ba lỗi plan, phát hiện bằng cách chạy thử

### C-01 (MAJOR) — CTA của nav trỏ vào một anchor không ai tạo

`SiteNav` có đúng **một** link (N9 định nghĩa bằng việc không có link row), và nó là
`href="#templates"`.

    $ grep -rn 'id="templates"' frontend/app frontend/components
    *** không có ***
    $ curl -s localhost:3000/ | grep -c 'id="templates"'
    0

Phần tử tương tác nổi bật nhất của cả landing page là một link chết. Và nó **chết vĩnh viễn**:
`grep 'id="templates"'` trên toàn bộ `docs/superpowers/plans/` không khớp plan nào. Plan 21 có tạo
`id="contact"` cho link footer, nhưng `#templates` thì không plan nào trong 19–28 nhận.

### C-02 (MAJOR) — hai `<footer>` trên trang chủ, hai ngôn ngữ thiết kế

    $ curl -s localhost:3000/ | grep -o '<footer' | wc -l
    2

`app/(public)/page.tsx` (từ plan 11/12) tự render `<footer>` riêng
("© … Portfolio Platform. All rights reserved.") bên trong
`<main className="min-h-screen bg-slate-950 text-white">`. Layout giờ mount thêm `SiteFooter`.

Không chỉ trùng thẻ: trang cũ là dark slate + font Tailwind mặc định, chrome mới là paper ấm +
Fraunces/EB Garamond. Ghép vào nhau thành một trang nửa tối nửa sáng. Thêm nữa `SiteNav` là
`fixed` không có spacer, nên nó đè lên `<header>` của trang.

Plan 19 không hề nhắc tới việc trang chủ đã có footer và shell riêng.

### C-03 (BLOCKER cho plan 20/21) — hai plan kế tiếp trỏ vào đường dẫn đã bị move

Plan 18b đã `git mv app/page.tsx` → `app/(public)/page.tsx`. Nhưng:

- `2026-09-20-20-landing-hero-about.md` — **4 chỗ** vẫn ghi `app/page.tsx`
- `2026-09-20-21-landing-services-contact.md` — **3 chỗ** vẫn ghi `app/page.tsx`

Nguy ở chỗ lượt giao sẽ không báo lỗi mà **tạo mới** `app/page.tsx`. Khi đó Next.js có hai page
cùng resolve về `/` và build vỡ với "You cannot have two parallel pages that resolve to the same
path" — hoặc tệ hơn, Hero/About mount vào file mới còn carousel nằm ở file cũ, không ai thấy.

(Plan 11 và 12 cũng nhắc `app/page.tsx` nhưng đó là lịch sử, đã chạy xong — không cần sửa.)

---

## Ship

Ba commit đúng và đã push. C-01 và C-02 làm trang chủ **xấu chứ không vỡ**, và pipeline deploy vẫn
đang chặn ở gate secrets nên không có gì tới tay người dùng.

Phải xử trước khi giao plan 20:

1. Vá 7 chỗ `app/page.tsx` → `app/(public)/page.tsx` trong plan 20 và 21 (C-03).
2. Giao cho plan 20 việc xoá `<footer>` và shell `bg-slate-950` trong `(public)/page.tsx` (C-02).
3. Quyết ai tạo `id="templates"` (C-01) — hợp lý nhất là plan 20, khi nó bọc lại carousel.
