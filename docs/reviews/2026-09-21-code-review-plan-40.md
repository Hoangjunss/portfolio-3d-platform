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

---

# Phụ lục — đã xanh (2026-09-21)

`npm run build` xuất tĩnh thành công; `npm test` chạy cả hai runner: **vitest 5/5**, **build gate 1/1**.
Không hồi quy: template-kit **47/47**, frontend **106/106**, backend **187/187**.

**B-03 đóng.** `--traceResolution` chỉ thẳng nguyên nhân, không phải đoán:

    'types' field 'index.d.ts' references .../@types/node/index.d.ts
    candidate module location '.../@types/node/ts5.6/index.d.ts'
    ======== Type reference directive 'node' was not resolved. ========

`@types/node@24.13.6` khai `typesVersions: {"<=5.6": ["ts5.6/*"], "<=5.7": ["ts5.7/*"]}` nhưng
**không ship thư mục `ts5.6/`**. TypeScript 5.6.3 khớp `<=5.6`, bị chuyển vào một đường dẫn không
tồn tại. Tức gói types đó đòi TS ≥ 5.8.

Ghim `@types/node` xuống `22.20.4` — bản **có** `ts5.6/` — thay vì nâng TypeScript ở một package,
vì `frontend` và `template-kit` đều chạy 5.6.3 và nâng lẻ sẽ làm phân mảnh monorepo.

## Ba lỗi nữa lộ ra sau khi B-03 được gỡ

**E-01 — native binary tải cụt.** Cùng một gói: rolldown binding ở `template-kit` là
**20.796.928 B**, ở `education` chỉ **6.026.240 B**. Đó cũng là lý do binary SWC của Next trong
cùng thư mục báo *"not a valid Win32 application"*. `npm ci` sạch khôi phục cả hai. Lỗi môi trường,
không phải lỗi code — nhưng nó giả trang thành lỗi code rất khéo.

**E-02 — `vitest.config.ts` chép nhầm tiền lệ.** Nó chép từ `template-kit`, nơi tsconfig đặt
`"jsx": "react-jsx"` nên oxc tự transform. `education` là app Next nên **buộc** `"jsx": "preserve"`,
và oxc phải được chỉ định runtime tường minh — đúng override mà `frontend/` đã có sẵn. Mọi `.tsx`
test đều không parse nổi. **Điều này sẽ đúng với cả 29 site package.**

**E-03 — hai bản React.** `@portfolio/template-kit` là `file:` dependency nên npm symlink kèm React
riêng; hook của kit chạy trên bản đó còn test render bằng bản của site → `Invalid hook call`.
`resolve.dedupe: ['react','react-dom']` xử lý. Next build không dính vì tsconfig `paths` phân giải
kit về source nằm trong chính graph của site. **Cũng sẽ đúng với cả 29 site.**

## Hai lỗi nhỏ trong chính test

- `build-gate.test.mjs` import `check-thumbnail.mjs` qua `../../` — đúng với cwd của script build,
  nhưng thiếu một cấp khi tính từ trong `scripts/`, nên file không nạp được.
- Nó chạy một bản build thật ~16s, quá **timeout mặc định 5s** của vitest. Đã loại `scripts/` khỏi
  vitest và cho `npm test` chạy cả hai runner.

## M-01 đóng

Đã bỏ `#about` và `#contact` khỏi footer — không id nào trên trang khớp. Cùng loại `#templates` ở
plan 19.

## Còn mở — ghi lại, không sửa trong lượt này

`EnrollmentSection` bắt lỗi `localStorage` rồi chỉ `console.error`. Không có xác nhận giả (đúng
yêu cầu), nhưng cũng **không có phản hồi nào cho người dùng**: Safari private hoặc hết quota thì
bấm "Đăng ký" không xảy ra gì và không ai biết vì sao. Mở rộng phạm vi ngoài mục tiêu "cho xanh",
nên để lại.
