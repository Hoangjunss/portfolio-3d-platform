# Code review — plan 40 (education site), Task 2+3: **chưa ship được**

**Ngày:** 2026-09-21
**Commit:** `acea7aa`, `ce05f6d` (lượt giao) + `e30bbfd` (Task 1 của tôi) + bản vá của tôi
**Kết quả:** phạm vi đúng, nhưng **build đỏ**. Một lỗi chặn đã sửa và xác minh; một lỗi còn mở.

## Lượt giao làm đúng phần của nó

12 file, không đụng `template-kit`/`backend`/`frontend`/`docs`, không đụng hai file Task 1 của tôi.
Thứ tự section đúng spec: `Hero` → `EnrollmentSection` → `ItemGrid` → accordion → `Footer`. Không
inline `style`, không màu hardcode — mọi giá trị hình thức đi qua token. `CurriculumAccordion` mang
đúng `className="curriculum"` nên bắt được chuỗi selector trong stylesheet của tôi, và dùng
`<details>/<summary>/<ol>` gốc. `try/catch` có quanh `localStorage`. Copy chrome tiếng Việt.

Font **được nạp thật**: `next/font/google`, `subsets: ['latin','vietnamese']`, `display: 'swap'`,
`<html lang="vi">`.

---

## B-01 (CHẶN, đã sửa) — kit không build được dưới App Router

```
x You're importing a component that needs `useState`. This React Hook only works in a
  Client Component. To fix, mark the file with the `"use client"` directive.
  template-kit/src/components/CommentThread.tsx:1:1
```

Ba component dùng hook mà thiếu `"use client"`: **`CommentThread`, `InquiryForm`, `RecordTable`**.
`useLocalCollection.ts` thì có.

Vì barrel `index.ts` re-export **toàn bộ**, chỉ cần `import { Hero } from '@portfolio/template-kit'`
là cả ba bị kéo vào module graph. Nghĩa là **không site nào trong 29 plan build được** — không riêng
plan 40.

**Vì sao 47/47 của plan 30 không bắt được, và không thể bắt được:** vitest render component trực
tiếp, không bao giờ đẩy chúng qua một bản build Next. Step CI mới thêm cho `template-kit` cũng chạy
đúng suite vitest đó, nên CI cũng mù với lỗi này. Đây là lỗ hổng phủ test ở tầng thiết kế, không
phải một test viết ẩu.

Đã vá (3 dòng) và **đo lại bằng thứ thật sự phơi bày nó**: sau khi thêm directive, `next build` báo
`✓ Compiled successfully` ở đúng chỗ trước đó chết. Kit vẫn 47/47.

## B-02 (CHẶN, do chính tôi gây ra, đã sửa) — font nạp về nhưng chữ không dùng

`layout.tsx` gắn `.className` của `next/font` lên `<html>`. Nhưng `next/font` đăng ký một family
**băm** (`__Be_Vietnam_Pro_xxxx`), không đăng ký tên thật. Mà `globals.css` của tôi trỏ vào tên thật:

```css
--font-display: "Be Vietnam Pro", ui-sans-serif, ...;
```

Nên mọi rule đặt `font-family: var(--font-display)` ghi đè family kế thừa bằng một tên không phân
giải được → rơi xuống `ui-sans-serif`/`Georgia`. Font tải về, font không được dùng, build xanh,
console sạch. Cùng họ với bug plan 19, sâu hơn một tầng.

**Nguyên nhân là câu trong handoff của tôi:** tôi viết *"apply their generated classNames to the
`<html>` element"*, trong khi stylesheet dựa trên token cần `variable:`. Lượt giao làm đúng lời tôi.

Đã chuyển sang `variable: '--font-display-face'` / `'--font-body-face'` và cho token trỏ vào chúng,
kèm comment cấm "rút gọn" ngược lại.

## B-03 (CHẶN, **còn mở**) — type-check đỏ

```
✓ Compiled successfully
Type error: Cannot find type definition file for 'node'.
  Entry point for implicit type library 'node'
```

Đã loại trừ, không phải suy đoán:

- `@types/node@24.13.6` **có** trong `templates/education/node_modules/@types/node`, đủ 51 file, có
  `index.d.ts`, `package.json` đọc được.
- `frontend/` build xanh với **đúng cặp** `@types/node@24.13.6` + `typescript@5.6.3` — nên không
  phải lệch phiên bản.
- Hai `tsconfig.json` gần như trùng nhau.
- Thêm `typeRoots` tường minh **không** sửa được. Tôi đã **gỡ bỏ** thay vì để lại một phỏng đoán
  trong repo.

Tôi dừng ở đây thay vì đoán tiếp. Ghi lại làm việc mở.

## M-01 (nhỏ) — hai anchor chết trong footer

`FOOTER_LINKS` có `#about` và `#contact`, nhưng trang không có section nào mang hai id đó
(`#courses`, `#curriculum` thì có). Cùng loại với `#templates` ở plan 19.

## Ghi chú môi trường

`@next/swc-win32-x64-msvc` báo *"is not a valid Win32 application"*, build rơi xuống wasm. Không
chặn nhưng làm build chậm, và có thể liên quan tới B-03.

## Trạng thái

Đã push: bản vá `"use client"`, bản vá font, `.gitignore` cho artifact build (`.next/`, `out/`,
`*.tsbuildinfo`, `next-env.d.ts` — trước đó không được che, ở cả `frontend/`).

**Plan 40 chưa xong.** B-03 phải đóng trước khi site này coi là ship được.
