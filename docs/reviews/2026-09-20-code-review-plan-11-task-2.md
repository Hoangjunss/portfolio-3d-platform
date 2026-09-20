# Code Review — Plan 11 Task 2 (Next.js scaffold + API client)

**Ngày:** 2026-09-20
**Phạm vi:** commit `b12cb83`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-11-frontend-scaffold.md`, Task 2
**Người viết code:** Antigravity (hai lượt) — review độc lập

## Độ bao phủ thật

Task 2 cần hai lượt. **Lượt đầu dừng đúng một file trước đích**: có đủ file cấu hình, `app/`,
và `lib/apiClient.test.ts` viết tốt — nhưng **`lib/apiClient.ts` không tồn tại**, tức bài test đã
có mà thứ nó kiểm thì chưa, và đó lại là module plan 12/13/14 đều import. Ghi ở `74afbca`.

Lượt sau tạo `apiClient.ts`, thêm ca test `AbortSignal` mà tôi yêu cầu, và chạy mutation —
nhưng **lại không commit**. Tôi commit.

| Hạng mục | Kết quả |
|---|---|
| 11 file, `node_modules`/`.next` bị loại đúng | Đúng |
| `npx vitest run` | **5/5 PASS** |
| Mutation M4–M7 | **Tôi tự chạy cả bốn, đều ĐỎ** |
| Commit | **Bỏ** — tôi commit (`b12cb83`) |

### Một bài học về đo đạc: tôi suýt báo sai một kết quả

Lần chạy `vitest` đầu tiên của tôi ra **1 fail** ở ca `throws on a non-2xx response`. Đọc file
thì thấy `if (!res.ok)` đã biến mất.

Nguyên nhân không phải lỗi code: **Antigravity đang chạy mutation M6 đúng lúc đó**, trên cùng
thư mục làm việc. Tôi bắt gặp repo giữa lúc file bị mutate. Nó báo "hoàn tất" trước khi thật sự
xong.

Nếu chỉ nhìn kết quả test mà không đọc file, tôi đã ghi một finding sai vào review. Cách phát
hiện là so nội dung file với thứ mình vừa đọc năm phút trước — và đó là lý do vòng review này
luôn đọc code chứ không chỉ chạy test. Sau khi chờ file khôi phục rồi chạy lại: 5/5 xanh.

---

## Phát hiện

### V-01 — `next@14.2.15` mà plan ghim là bản có lỗ hổng, và lỗ hổng đó phá đúng plan 13 (MAJOR — **đã nâng ở `b12cb83`**)

`npm install` in thẳng cảnh báo của registry:

```
npm warn deprecated next@14.2.15: This version has a security vulnerability.
Please upgrade to a patched version.
```

Đọc `npm audit`, trong danh sách advisory của dải đó có **GHSA-f82v-jwr5-mffw — Authorization
Bypass in Next.js Middleware**. Plan 13 tên là "admin auth middleware": toàn bộ thiết kế chặn
`/admin` của frontend dựa vào Next.js middleware. Một lỗ bypass ở đúng lớp đó không phải cảnh
báo chung chung — nó vô hiệu hoá chính thứ plan 13 sắp dựng.

Nâng `next` lên **14.2.35** (bản vá mới nhất của dòng 14.2, không đổi major nên plan 11–14 không
phải viết lại). Kiểm chứng sau khi nâng: `npm audit | grep -c GHSA-f82v-jwr5-mffw` → **0**.

Cũng nâng `vitest` 2.1.2 → 2.1.9 (path traversal của `@vitest/mocker`, lỗi esbuild dev server).
Chỉ là công cụ dev, không vào bundle.

### V-02 — Sau khi nâng vẫn còn 9 vulnerability, và lối thoát là nhảy hai major (MAJOR, chưa xử lý)

`npm audit` sau khi nâng vẫn báo dải bị ảnh hưởng của `next` là
`9.3.4-canary.0 - 16.3.0-preview.10`. Bản `latest` là **16.3.5**, tức **chỉ Next 16.3.5+ mới nằm
ngoài dải**. Nói cách khác: ở lại dòng 14 nghĩa là ship với advisory mức critical đã biết, còn
sạch hoàn toàn thì phải nhảy 14 → 16, kéo theo React 19 và loạt thay đổi App Router, ảnh hưởng
cả plan 11, 12, 13, 14.

**Không tự quyết ở đây** — đây là đánh đổi phạm vi thuộc về người chủ dự án, không phải một lỗi
để vá lặng lẽ. Ghi thành finding mở, và **plan 12 phải là chỗ chốt** vì nó là plan frontend tiếp
theo và là chỗ `@react-three/fiber` gắn vào (R3F 8.x là dòng dành cho React 18; lên React 19 có
thể phải lên R3F 9).

Cần nói rõ mức độ khẩn: phần lớn advisory còn lại nhắm vào Image Optimization, Server Actions và
cache poisoning. Spec mục 4 nói template là **static export** phục vụ qua nginx, nên bề mặt tấn
công thật nhỏ hơn con số 9 gợi ý — nhưng `/admin` thì chạy runtime thật.

### V-03 — `three-mesh-bvh@0.7.8` deprecated vì không tương thích three.js (INFO, thuộc plan 12)

```
npm warn deprecated three-mesh-bvh@0.7.8: Deprecated due to three.js version
incompatibility. Please use v0.8.0, instead.
```

Nó vào cây phụ thuộc qua `@react-three/drei@9.114.3`. Chưa có code nào dùng, nhưng plan 12 là
plan carousel 3D — nếu gặp lỗi lạ ở `drei` thì đây là chỗ nhìn đầu tiên.

### V-04 — Không có cảnh báo peer dependency nào (ghi nhận, câu hỏi đã được trả lời)

Handoff yêu cầu báo cáo nguyên văn nếu có xung đột peer giữa React 18 và R3F/drei, và **tuyệt đối
không** tự thêm `--legacy-peer-deps`. Kết quả: `npm install` thoát 0, không có `ERESOLVE`, không
có cảnh báo peer nào. Không ai phải thêm cờ gì. Câu hỏi trong bản khảo sát sẵn sàng frontend —
"npm 11 có giải peer nghiêm ngặt hơn gây xung đột không" — giờ đã có câu trả lời đo được: không.

---

## Điều làm tốt

- **`trackEvent` dựng body tường minh** thay vì `JSON.stringify(payload)`. Đây là chi tiết khiến
  quyết định (g) thành thật: kể cả khi ai đó thêm trường vào `TrackEventPayload`, thứ gửi đi vẫn
  chỉ có ba khoá. M5 đỏ được là nhờ vậy.
- **`templateId` chỉ được thêm khi `!== undefined`**, nên không gửi `"templateId": null` thừa cho
  các sự kiện không gắn template.
- **Ca test `AbortSignal` được thêm đúng ý** sau khi tôi chỉ ra: bắt `init?.signal` trong mock và
  assert nó tồn tại. M7 đỏ chứng minh nó có sức nặng.
- Comment trong `catch` nói đúng WHY (analytics best-effort), không mô tả lại code.

---

## Kết luận

**VERDICT: PASS — `b12cb83`.**

5/5 test frontend, bốn mutation đều đỏ, backend vẫn 126/126. Plan 11 xong cả hai task.

| Finding | Xử lý |
|---|---|
| **V-01** | **Đã sửa** — `next` 14.2.35, advisory middleware bypass biến mất |
| **V-02** | **Plan 12 phải chốt**: ở lại Next 14 với advisory còn lại, hay nhảy lên 16 |
| V-03 | Plan 12 — nhìn `three-mesh-bvh` đầu tiên nếu `drei` lỗi lạ |
| V-04 | Không có xung đột peer; không cần `--legacy-peer-deps` |
