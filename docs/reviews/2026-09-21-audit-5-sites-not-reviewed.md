# Rà tổng hợp — 5 site do tiến trình khác dựng (`agency`, `corporate`, `realestate`, `restaurant`, `saas`)

**Ngày:** 2026-09-21
**Phạm vi:** năm site trong `templates/` mà tôi **không** thiết kế và **không** review khi chúng
được push, cộng `template-kit` (plan 30).
**Cách làm:** cài thật, chạy `npm test` thật, `npm run build` thật, rồi kiểm ở **artifact xuất ra**
(`out/index.html`, `out/_next/static/css/*.css`) chứ không đọc source.

---

## 0. Điều cần nói trước: **không site nào từng được cài**

Khi tôi nhận, cả năm thư mục đều có `node_modules` **rỗng**. Không site nào từng được `npm install`,
nên `npm test` và `npm run build` **chưa từng chạy** trên bất kỳ site nào trong số đó. Chúng được
commit và push dựa trên việc đọc code.

Tin tốt: sau khi tôi cài và chạy, **cả năm đều xanh**.

| Site | Test | Build | Build gate trong `npm test` |
|---|---|---|---|
| agency | 8/8 | ✓ | **không có** |
| corporate | 3/3 | ✓ | có |
| realestate | 8/8 | ✓ | không gọi |
| restaurant | 5/5 | ✓ | không gọi |
| saas | 4/4 | ✓ | chạy qua vitest |

---

## 1. F-01 (NẶNG) — ba site khai font rồi không bao giờ nạp

Kiểm ở CSS mà trình duyệt thật sự tải:

| Site | `@font-face` | subset `u+1ea0` | `lang` | token khai gì |
|---|---|---|---|---|
| corporate | **30** | có | `vi` | `var(--font-display-face)` — đúng |
| realestate | **0** | không | `vi` | `"Be Vietnam Pro"`, `"Plus Jakarta Sans"` |
| restaurant | **0** | không | `en` | `"Fraunces"`, `"Plus Jakarta Sans"` |
| saas | **0** | không | `en` | `"IBM Plex Sans Condensed"`, `"Manrope"` |
| agency | 0 | không | `en` | system stack — **chủ ý, không phải lỗi** |

`layout.tsx` của realestate, restaurant và saas **không import `next/font` gì cả**. Token gọi tên
font theo chữ, không có gì nạp chúng, nên mọi quy tắc rơi xuống fallback. Build xanh, console sạch,
chữ sai mặt.

Đây **đúng con bug đã ship một lần ở site portfolio chính (plan 19)** và một lần nữa ở education —
giờ nhân lên ba site. `corporate` làm đúng (`variable:` + `var(--font-*-face)`), nên khuôn mẫu đúng
đã tồn tại ngay trong repo để chép.

Nặng nhất là **realestate**: `lang="vi"`, thương hiệu "Sông Hồng", mà chữ rơi xuống một fallback
không bảo đảm phủ dấu tiếng Việt.

`restaurant` còn chọn **Fraunces** — đúng display face của site portfolio chính. Nạp được cũng đụng.

## 2. F-02 — `agency` không có build gate

`npm test` của agency chỉ chạy vitest; không có `scripts/build-gate.test.mjs`. Tôi phải tự chạy
`npm run build` mới biết nó build được. Bốn site kia đều có gate (dù hai site không gọi nó trong
`npm test`). Đây là site duy nhất mà một lần build hỏng sẽ đi lọt hoàn toàn.

## 3. F-03 — anchor chết

| Site | Link trỏ vào hư vô |
|---|---|
| agency | `#contact` |
| realestate | `#about`, `#agents` |
| restaurant | `#about` |
| corporate, saas | không có |

Cùng loại `#templates` ở plan 19 và `#about`/`#contact` ở education.

**`saas` có biến thể tệ hơn và phép kiểm anchor không bắt được:** link tồn tại nhưng **gắn nhãn sai
đích** — `Docs → #features-heading`, `Contact → #pricing`. Không phải link chết, nhưng đưa người
dùng tới chỗ không liên quan.

## 4. F-04 — hai site thiếu `resolve.dedupe`

`realestate` và `restaurant` không có `dedupe: ['react','react-dom']`. Hiện **chưa** vỡ, nhưng kit
là `file:` dependency được npm symlink kèm React riêng; bug này nổ ngay khi test đầu tiên gọi một
hook của kit. Nó đã làm đỏ site event đúng theo cách đó.

## 5. Tầng thiết kế — diversification không còn kiểm chứng được

Đọc `.hallmark/log.json`:

- **`Catalogue` bị dùng ba lần**: education (của tôi), realestate, restaurant. Quy tắc cấm trùng
  macrostructure giữa các lượt, và tiêu chí #10 đòi khác biệt trên cả 28 site.
- **`saas` không có mục nào trong log** — nhiều khả năng chưa từng chạy phiên Hallmark.
- Nhiều site tự đặt tên trục **ngoài từ vựng chuẩn**: `architectural-humanist`, `mineral-spruce`,
  `crisp-grotesque`, `cool-lapis-brass`, `warm-serif`. Từ vựng của skill là một tập đóng
  (`high-contrast-serif`, `roman-serif`, `classical-serif`, `geometric-sans`, `grotesk-sans`,
  `rounded-sans`, `mono`, `display-condensed`, `display-heavy`, `risograph-bold`; warm/cool/neutral/
  chromatic-other).

Điểm cuối là quan trọng nhất và dễ bị xem nhẹ: **quy tắc diversification chỉ thực thi được khi từ
vựng trục dùng chung.** Nếu mỗi site tự đặt tên trục, không ai — kể cả lượt sau — phát hiện được
trùng lặp. `mineral-spruce` và `cool-teal` có thể là cùng một màu; không có cách nào biết.

## 6. Tính trung thực nội dung

Không tìm thấy số liệu bịa trình bày như thật trong seed của cả năm site.

`saas` dùng `StatBlock` và có công bố, nhưng **yếu hơn** nonprofit: một `aria-label="Illustrative
demo figures"` (người nhìn không đọc được) cộng chữ `(illustrative)` ở cuối mỗi nhãn dài. So với
nonprofit — một câu đầy đủ, cỡ chữ thân bài, tương phản đầy đủ, ngay dưới các con số. Không gian
dối, nhưng nếu mục đích của luật là để người đọc **thật sự** biết thì bản của saas mới đạt phần chữ.

---

## 7. Đính chính một kết luận cũ của **tôi**

Review plan 40 của tôi khẳng định `@types/node@24.13.6` khai `typesVersions` trỏ vào `ts5.6/` **mà
không ship thư mục đó**, và đó là nguyên nhân lỗi `TS2688` ở site education. Tôi ghim xuống
`22.20.4` và build xanh, nên coi như đã chứng minh.

**Sai.** `realestate` và `restaurant` chạy `@types/node@24.13.6` với TypeScript 5.6.3 và **build
bình thường**. Kiểm trực tiếp trong `node_modules` của chúng:

    version: 24.13.6
    typesVersions: {"<=5.6":{"*":["ts5.6/*"]},"<=5.7":{"*":["ts5.7/*"]}}
    ts5.6/index.d.ts: CÓ

Thư mục **có tồn tại**. Nguyên nhân thật ở education gần như chắc chắn là **bản cài hỏng** — đúng
lần install đã cho ra binary rolldown cụt; gói `@types/node` khi đó nhiều khả năng cũng bị giải nén
thiếu. Ghim xuống 22 đi kèm một lần tải sạch, nên nó "sửa được" vì lý do khác với lý do tôi viết.

**Hệ quả:** `^24` ở realestate/restaurant **không phải lỗi**, và tôi đã sửa lại STATUS cùng memory.
Bài học đúng là: khi một lỗi xuất hiện trên một bản cài đã biết là hỏng, **hãy cài lại sạch trước
khi đi tìm nguyên nhân ở nơi khác.**

---

## 8. Việc cần làm, theo thứ tự

1. **Nạp font ở `realestate`, `restaurant`, `saas`** — chép khuôn `corporate/app/layout.tsx`. Đây là
   thứ duy nhất trong danh sách làm ba site hiện sai mặt chữ trước mắt người xem.
2. **Sửa 4 anchor chết** + 2 link gắn nhãn sai đích ở saas.
3. **Thêm build gate cho agency**, và gọi gate trong `npm test` của realestate/restaurant.
4. **Thêm `resolve.dedupe`** cho realestate/restaurant trước khi chúng thêm test dùng hook.
5. **Chốt từ vựng trục** và ghi lại log cho các site đã lệch; bổ sung mục cho saas. Không làm việc
   này thì tiêu chí #10 chỉ còn là hình thức cho 17 site còn lại.
