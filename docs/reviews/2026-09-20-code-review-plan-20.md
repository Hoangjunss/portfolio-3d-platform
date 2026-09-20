# Code review — plan 20 (Hero + About), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `c5b5500`, `450fa59`, `e8dd410`
**Kết quả:** đủ task, đúng phạm vi, **54/54 test**. Một quan sát cần người chủ dự án quyết, không
phải lỗi implement.

## Phạm vi

    frontend/app/(public)/page.tsx              | 27 +++-------
    frontend/components/AboutSection.tsx        | 42 ++++++++++++++
    frontend/components/AboutSection.test.tsx   | 24 ++++++++
    frontend/components/HeroSection.tsx         | 27 +++++++++
    frontend/components/HeroSection.test.tsx    | 16 ++++++
    frontend/components/RevealOnScroll.tsx      | 41 +++++++++++++
    frontend/components/RevealOnScroll.test.tsx | 34 +++++++++++
    frontend/lib/contentClient.ts               | 14 ++++++
    frontend/lib/contentClient.test.ts          | 33 +++++++++++

`package.json` / `package-lock.json`: **không đụng** — ràng buộc gắt nhất của lượt giao, giữ được.

## Ba bản vá tôi nhét vào plan đều được tôn trọng

| Vá | Kiểm | Kết quả |
|---|---|---|
| C-03 — đúng đường dẫn `(public)/page.tsx` | route table | `/` đúng một lần, không có `/(public)/` ✅ |
| C-04 — giữ carousel + `getTemplates()` + Decision (j) | đọc file | còn nguyên cả ba ✅ |
| C-01 — thêm `id="templates"` | HTML runtime | có ✅ |
| C-02 — bỏ footer cũ + shell dark | HTML runtime | 1 footer, 0 `bg-slate-950` ✅ |
| D-05 — không nhân bản `API_BASE` | đọc file | `import { API_BASE } from "./apiClient"` ✅ |

## Tự kiểm

| Kiểm | Kết quả |
|---|---|
| Test suite | **54/54 PASS**, 16 file (47 + 7 mới) |
| Build + type-check | xanh; `/` giờ có `Revalidate 1m` — đúng `next: { revalidate: 60 }` |
| Mọi `var(--token)` trong 4 file mới | có thật trong `tokens.css`, 0 thiếu |
| Docblock `// @vitest-environment jsdom` | 3/3 file test component (test `contentClient` là hàm thuần, không cần — đúng) |

### Runtime

    footers      : 1   ✅
    id=templates : 1   ✅
    bg-slate-950 : 0   ✅
    nav CTA      : 1   ✅
    /admin/login : 0 vết của chrome public  ✅

**C-01 đóng:** `href="#templates"` và `id="templates"` cùng có mặt. CTA duy nhất của `SiteNav` —
thứ đã chết suốt từ plan 19 — giờ có đích.

### Backend tắt, trang vẫn lên

Chạy kiểm khi không có backend, tức là đi thẳng vào nhánh fallback:

    <h1 ...>See your site before you build it.
    <h2 ...>Một xưởng, hai mươi bản thiết kế.

Decision (j) hoạt động: `getTemplates()` ném lỗi, `catch` trả mảng rỗng, trang render đủ chứ không
trắng. `getContentSection` trả `null` và cả hai section dùng copy mặc định.

---

## Quan sát cần quyết — không phải lỗi implement

H1 là **tiếng Anh** ("See your site before you build it.") trong khi phần còn lại của trang là tiếng
Việt: H2 "Một xưởng, hai mươi bản thiết kế.", nav "Xem template", footer "Đăng nhập quản trị", và
`<html lang="vi">`. Plan 21 sẽ thêm form với nhãn tiếng Việt nữa.

**Lượt giao làm đúng.** Spec `2026-09-20-landing-page-ui-design.md` **dòng 71** chỉ định chính xác
câu tiếng Anh đó cho Hero. Đây là lệch ở tầng spec, không phải ở code.

Dòng chữ lớn nhất trang khác ngôn ngữ với mọi thứ quanh nó là một quyết định sản phẩm. Tôi không tự
sửa copy đã được duyệt trong spec. Hai đường: đổi spec sang tiếng Việt, hoặc xác nhận headline tiếng
Anh là chủ ý. **Cần trả lời trước khi plan 21 đáp xuống**, vì lúc đó Contact form sẽ khoá luôn
giọng tiếng Việt cho nửa dưới trang.
