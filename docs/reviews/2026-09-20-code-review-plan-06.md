# Code Review — Plan 06 (content / media / settings)

**Ngày:** 2026-09-20
**Phạm vi:** commit `e99ae9e` (local, chưa push)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-06-content-media-settings.md`
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **58/58 PASS**, 3 lần chạy liên tiếp |
| Số test trước / sau | 34 → 58 (+24) |
| Task 1–6 | **Xong cả sáu** |
| Commit body | Đầy đủ, có cả ba quyết định thiết kế plan yêu cầu ghi lại |

### Chín lỗi của plan 06 bản cũ — không cái nào tái phát

| Lỗi cũ | Trạng thái |
|---|---|
| Path traversal ở upload | **Đóng.** Tên file lưu = `UUID + extension` suy từ loại đã sniff; tên gốc chỉ vào cột hiển thị; có thêm chặn `normalize().startsWith()` |
| Stored XSS qua file upload | **Đóng.** Allow-list 4 loại ảnh raster, không có `image/svg+xml`; loại nhận dạng bằng magic bytes |
| `columnDefinition = "jsonb"` | **Đóng.** Cả hai entity dùng `String` trần, có comment nêu lý do H2 |
| `@Cacheable` trả `Optional` | **Đóng.** Trả Dto, thiếu thì ném `ResourceNotFoundException` |
| Actor `null` ở cả ba module | **Đóng.** Cả ba resolve qua `UserService.findIdByUsername` |
| Controller trả entity `Media` | **Đóng.** Trả `MediaDto` |
| `@Audited` trên method không trả `Long` | **Đóng.** `store` và `set` đều trả id |
| `@Column(name = "key")` hỏng trên H2 | **Đóng.** `@Column(name = "\"key\"")`, commit body xác nhận chạy được |
| `action = "UPDATE"` cho cả lần tạo | **Giữ nguyên có lý do** — xem C-05 |

### Mutation check — 5/6 đỏ, **1 vẫn xanh**

Tôi tự chạy, không dùng kết quả Antigravity tự báo. Đây chính là lý do phải tự chạy.

| # | Revert gì | Test | Kết quả |
|---|---|---|---|
| M1 | dựng path từ tên file gốc | `MediaServiceTest` | RED |
| M2 | bỏ allow-list | `MediaServiceTest` | RED |
| M3 | **`media.setMimeType(file.getContentType())`** | `MediaServiceTest` | **VẪN XANH** |
| M4 | uploader về `null` | `MediaServiceTest` | RED |
| M5 | cho EDITOR vào settings | `SettingsControllerTest` | RED |
| M6 | ngừng tăng `version` | `ContentSectionServiceTest` | RED |

M3 là phát hiện C-02 bên dưới.

---

## Phát hiện

### C-01 — Upload bị từ chối trả 500 và ghi một dòng `system_error_logs` (MAJOR, đã kiểm chứng bằng probe)

`MediaServiceImpl` ném `IllegalArgumentException` (sai loại, quá cỡ, file rỗng) và
`SecurityException` (traversal). `GlobalExceptionHandler` **không có handler nào cho hai loại
này**, nên chúng rơi vào `@ExceptionHandler(Exception.class)`.

Tôi dựng một test tạm, chạy thật, rồi xoá. Kết quả:

```
PROBE_STATUS=500
PROBE_BODY={"code":"INTERNAL_ERROR","message":"Something went wrong","requestId":"6864c44b-..."}
PROBE_ERRORLOG_DELTA=1
```

Hai hệ quả:

1. Admin chọn nhầm file `.txt` thì nhận "Something went wrong" — không biết mình làm sai gì.
   Client không phân biệt được "gửi sai" với "server hỏng".
2. **Mỗi lần từ chối ghi một dòng `system_error_logs`.** Một người có role EDITOR upload rác
   trong vòng lặp là bơm được bảng đó tuỳ ý. Đây đúng ràng buộc của chính plan: *nothing below 5xx
   may write one* — và 400 không phải 5xx.

Đây **cùng một dạng lỗi với R-01** (404 thành 500) đã bắt ở plan 04 và vá ở plan 04b. Khuôn mẫu
đang lặp: mỗi plan thêm exception mới mà quên thêm handler, và catch-all nuốt hết.

`MediaControllerTest` không bắt được vì nó chỉ có hai ca: 200 và 401. Bốn test bảo mật nằm ở tầng
**service**, nơi chúng assert thẳng loại exception — nên không ca nào đi qua tầng HTTP để thấy
client thật sự nhận gì.

Sửa: thêm `@ExceptionHandler` cho `IllegalArgumentException` → 400 `VALIDATION_FAILED` và
`SecurityException` → 400, **không ghi log row**; kèm test ở tầng controller assert cả status lẫn
`system_error_logs` count không đổi. Tốt hơn nữa là dùng một exception có kiểu riêng
(`InvalidUploadException`) thay vì `IllegalArgumentException`, vì `IllegalArgumentException` là
loại Spring và thư viện khác cũng ném — map nó về 400 toàn cục có thể che một lỗi thật thành 400.

### C-02 — `store_withSpoofedContentType_usesSniffedType` không kiểm điều mà tên nó hứa (MAJOR)

Đổi `media.setMimeType(detectedMimeType)` thành `media.setMimeType(file.getContentType())` — tức
là **tin lại content-type của client** — mà suite vẫn xanh.

Lý do: test đưa vào một file có **nội dung SVG** khai là `image/png`. Nhận dạng magic-byte thấy
không khớp allow-list nên ném exception. Test assert đúng cái exception đó:

```java
assertThatThrownBy(() -> mediaService.store(spoofedFile, "admin"))
        .isInstanceOf(IllegalArgumentException.class);
```

Đó là một test hợp lệ và hữu ích — nhưng nó kiểm "nội dung SVG bị chặn", không phải "giá trị lưu
xuống là loại đã sniff". Ca chưa được phủ là: **một file PNG thật, khai `Content-Type: text/html`.**
Nó qua được nhận dạng, và không có gì đảm bảo cột `media.mime_type` ghi `image/png` chứ không
phải `text/html`.

Vì sao quan trọng: `MediaDto.mimeType` lấy từ cột đó, và plan 16 sẽ phục vụ `/media/**`. Nếu
Nginx hay FE dùng `mime_type` trong DB để đặt `Content-Type` khi trả file, thì stored XSS quay
lại — đúng lỗ hổng plan này được viết ra để bịt.

Đáng nói: Antigravity **có** chạy mutation #3, nhưng nó mutate nhánh *kiểm tra* nên file bị từ
chối theo đường khác và test đỏ. Mutation tôi chạy nhắm vào nhánh *ghi xuống*. Cùng một tên
mutation, hai phép biến đổi khác nhau, hai kết luận khác nhau.

Sửa: thêm ca test dùng PNG thật khai sai content-type, assert `savedMedia.getMimeType()` bằng
`"image/png"`. Đổi tên test hiện tại thành `store_withSvgContentDeclaredAsPng_isRejected` cho
đúng việc nó làm.

### C-03 — `in.read(header)` có thể đọc thiếu (MINOR)

```java
byte[] header = new byte[12];
int read = in.read(header);
if (read < 3) { throw ... }
```

`InputStream.read(byte[])` **không đảm bảo** lấp đầy mảng kể cả khi stream còn dữ liệu. Với
`MockMultipartFile` (nền byte array) thì luôn đủ, nên test không bao giờ thấy. Với multipart nền
file hoặc network stream, một lần đọc trả 8 byte là hợp lệ — khi đó nhận dạng WEBP (cần 12 byte)
sẽ trượt và **một file WEBP hợp lệ bị từ chối**.

Sửa: `in.readNBytes(12)`.

### C-04 — `file_name` lưu nguyên tên gốc do người gửi đặt (MINOR)

Ta đã quyết định không tin tên file để dựng đường dẫn — đúng. Nhưng nguyên văn tên đó vẫn được
lưu và trả ra trong `MediaDto.fileName`. Nếu trang admin ở plan 14 render nó không escape thì có
XSS qua tên file.

Không phải lỗi backend. Ghi lại để plan 14 biết trường này là dữ liệu **không tin được**.

### C-05 — `action = "UPDATE"` cho cả lần ghi đầu (INFO, quyết định có lý do)

Commit body ghi rõ: giữ một method `upsert` duy nhất để tránh self-invocation làm hỏng proxy
Spring (gọi `this.create()` nội bộ thì `@Audited` không chạy), và chấp nhận lần ghi đầu bị ghi
nhận là UPDATE.

Đây là lý do đúng và là đánh đổi hợp lý — tách method rồi gọi nội bộ đúng là mất aspect. Chấp
nhận. Hệ quả cần nhớ: dòng audit không phân biệt được lần tạo section với lần sửa.

---

## Điều làm tốt

- **Phần lưu file làm chắc.** Tên lưu suy hoàn toàn từ `UUID` + phần mở rộng lấy từ loại đã
  sniff; tên gốc không bao giờ chạm tới đường dẫn; vẫn thêm `normalize().startsWith()` như lớp
  chặn thứ hai dù về lý thuyết đã không cần.
- **Nhận dạng bằng magic bytes thật**, viết tay cho PNG/JPEG/GIF/WEBP, không tin `getContentType()`
  ở nhánh kiểm tra.
- `image/svg+xml` vắng mặt **có chủ ý và có comment** — đúng chỗ dễ bị ai đó "bổ sung cho đủ".
- Test bảo mật dùng `@TempDir` nên không đụng đường dẫn thật.
- Ba quyết định thiết kế plan yêu cầu ghi lại đều có trong commit body, kể cả cái bất lợi
  (orphan file khi rollback).
- Comment mới đều là WHY.

---

## Kết luận

**VERDICT: NEEDS_REVISION — chưa push.**

24 test mới, 58/58 ổn định, chín lỗi của bản plan cũ không cái nào tái phát, và phần lưu file —
chỗ nguy hiểm nhất — làm đúng. Nhưng C-01 là hồi quy hành vi có thể khai thác được (EDITOR bơm
`system_error_logs` tuỳ ý) và C-02 nghĩa là một trong bốn test bảo mật không canh đúng thứ nó
tuyên bố canh.

Giữ `e99ae9e` ở local, gộp C-01 + C-02 + C-03 vào task 1 của plan 07, rồi push cả cụm — cùng cách
đã làm với plan 04 và 04b.

| Finding | Xử lý |
|---|---|
| C-01 | plan 07 task 1 — handler 400 cho lỗi upload, kèm test tầng controller assert cả status lẫn log count |
| C-02 | plan 07 task 1 — thêm ca PNG thật khai sai type, assert giá trị `mime_type` lưu xuống |
| C-03 | plan 07 task 1 — `readNBytes(12)` |
| C-04 | Ghi chú cho plan 14: `fileName` là dữ liệu không tin được |
| C-05 | Chấp nhận, đã ghi lý do |
