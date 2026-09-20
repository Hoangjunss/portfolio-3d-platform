# Code Review — Plan 12 Task 1 (thumbnail URL cho trang công khai)

**Ngày:** 2026-09-20
**Phạm vi:** commit `a181faf`, sửa thêm ở `d72f715`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-12-3d-carousel.md`, Task 1
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

Lượt giao ngay trước lượt này tạo ra **0 file** (ghi ở `ad50ff7`). Lượt này làm đủ.

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–7 | **Xong cả bảy**, kể cả commit |
| Quyết định (a) không tạo endpoint media công khai | Đúng |
| Quyết định (b) resolve ở service, không ở converter | Đúng — `TemplateConverterImpl` không chạm `MediaRepository` |
| Quyết định (c) một `findAllById`, không N+1 | Đúng, có `.distinct()` |
| Quyết định (d) `null` khi không có thumbnail | Đúng |
| Backend `mvn clean test` | **130/130 PASS** (126 → 130) |
| Frontend `npx vitest run` | **5/5 PASS**, type lên mười ba trường |
| `npm run build` | Thành công |

### Mutation check — commit body trống, tôi tự chạy cả ba

| # | Revert gì | Kết quả tôi đo |
|---|---|---|
| M1 | `findById` trong vòng lặp thay cho `findAllById` | **ĐỎ** — `Wanted but not invoked` |
| M2 | trả media id thay vì URL | **ĐỎ** |
| M3 | trả `""` thay vì `null` | **ĐỎ** |

Một ghi chú về chất lượng phép đo: M2 và M3 đỏ dưới dạng **Errors** chứ không phải **Failures**.
Lý do là `TemplateServiceTest` mock `TemplateConverter`, nên khi giá trị truyền vào đổi thì stub
không khớp và Mockito ném trước khi assertion chạy. Vẫn là bắt được, nhưng bắt bằng "stub không
khớp" yếu hơn bắt bằng assertion. Cái canh giá trị thật từ đầu đến cuối là
`PublicTemplateControllerTest#listActive_carriesThumbnailUrlInJson`, chạy qua HTTP thật.

---

## Phát hiện

### T-10 — `listAllForAdmin` không bao giờ resolve `thumbnailUrl` (MAJOR — **đã sửa ở `d72f715`**)

`listActive` resolve đúng. Nhưng `listAllForAdmin` vẫn đi qua
`toDtoList` → `toDto(template)` → `toDto(template, null)`.

Kết quả: **cùng một `TemplateDto`, hai hành vi.** `/api/public/templates` trả URL thật,
`/api/admin/templates` luôn trả `thumbnailUrl: null`.

Đây đúng hình dạng của **T-02** — trường có trong DTO mà không đường nào điền — thứ dự án này đã
mất một vòng review để phát hiện lần trước. Plan 14 dựng bảng template cho admin sẽ thấy cột ảnh
trống và phải tự đi tìm lý do.

Không phải lỗi của plan: Task 1 chỉ nói "cho trang công khai". Nhưng một trường DTO chỉ được điền
ở một trong hai đường sản xuất là cái bẫy để lại cho người sau, và giá sửa ngay là tám dòng.

Đã tách `withThumbnailUrls(List<Template>)` dùng chung, nên cả hai đường cùng được một
`findAllById` cho cả trang. Thêm `listAllForAdmin_alsoResolvesThumbnailUrl` chặn hồi quy.

### T-11 — Quyết định (e) không ai trả lời, nên tôi tự kiểm (ghi nhận, **không cần sửa**)

Plan yêu cầu: kiểm `@CacheEvict` hiện có và **báo cáo dù có phải sửa hay không**. Commit body
trống nên không có câu trả lời nào.

Tôi tự kiểm. `@CacheEvict(value = "public-templates", allEntries = true)` đã có trên cả ba đường
ghi template (create, update, softDelete). Và cache **không thể bị cũ vì media**, vì hai lý do:

- `media.url` là `UUID + phần mở rộng`, đặt một lần lúc upload và **không bao giờ đổi** — không
  có endpoint sửa hay xoá media.
- `template.thumbnailMediaId` chỉ đổi qua `update`, mà `update` đã evict.

Nên kết luận đúng là **không cần sửa gì**. Nhưng đó là kết luận phải nói ra; im lặng thì không
phân biệt được với "chưa kiểm".

### T-12 — Commit body trống, lần thứ ba trong bốn lượt gần đây (MINOR, lỗi quy trình)

Không mutation, không số test, không câu trả lời cho (e). Handoff nêu rõ yêu cầu này và nhắc rằng
hai trong ba lượt trước đã thiếu. Đây là chỗ đang xấu đi chứ không tốt lên.

---

## Điều làm tốt

- **`.distinct()` trước khi `findAllById`** — plan không yêu cầu. Hai template dùng chung một
  thumbnail sẽ không làm truy vấn lặp id.
- **`mediaIds.isEmpty() ? Collections.emptyMap() : ...`** — tránh gọi `findAllById(List.of())`,
  một truy vấn vô ích trên trang chủ khi chưa có template nào gắn ảnh.
- **`PublicTemplateControllerTest` tự xoá cache** trước mỗi ca (`cacheManager.getCache(...).clear()`).
  Không có bước đó thì ca thứ hai đọc giá trị cache của ca thứ nhất và test thành vô nghĩa —
  đúng loại bẫy mà `@Cacheable` hay giăng cho test tích hợp.
- **Giữ `toDto(Template)` cũ** gọi sang `toDto(template, null)`, nên mọi nơi gọi cũ vẫn biên dịch.
  Đúng cách mở rộng một interface đang có người dùng.

---

## Kết luận

**VERDICT: PASS — `a181faf` + `d72f715`.**

Backend 131/131, frontend 5/5, build xanh. P-05 đóng: trang công khai giờ có đường lấy thumbnail
mà không phải mở một endpoint media công khai.

| Finding | Xử lý |
|---|---|
| **T-10** | **Đã sửa** (`d72f715`) — dùng chung `withThumbnailUrls`, có test chặn hồi quy |
| T-11 | Đã tự kiểm: `@CacheEvict` hiện có là đủ, **không cần sửa** |
| T-12 | Ghi nhận — lượt sau phải khai mutation và trả lời các mục plan yêu cầu báo cáo |

**Còn lại của plan 12:** Task 2 (carousel, 10 step) chưa bắt đầu.
