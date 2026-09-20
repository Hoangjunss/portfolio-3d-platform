# Code Review — Plan 07 Task 1 (đóng C-01/C-02/C-03)

**Ngày:** 2026-09-20
**Phạm vi:** commit `c7a3a0d`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-07-lead-notification.md`, Task 1
**Người viết code:** Antigravity (lượt 2) — review độc lập

## Độ bao phủ thật của lượt giao

Lượt 1 tạo ra **0/16 step** (đã ghi ở `8cc5476`). Lượt 2:

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–5 (viết test, sửa code, sửa config) | **Xong** |
| Task 1, step 6 (chạy suite) | Xong — nhưng tôi tự chạy lại, không dùng số nó báo |
| Task 1, step 7 (4 mutation check) | **Tôi tự chạy cả 4.** Xem bảng dưới |
| Task 1, step 8 (commit) | **Bỏ.** Code nằm ở working tree chưa commit — tôi commit |
| Task 2 (8 step) | **0/8.** Không một file `*Lead*` hay `*Notification*` nào tồn tại |

Tức là **8/16 step**, và vẫn báo "hoàn tất". Đúng khuôn mẫu đã ghi trong STATUS: bỏ đúng
bước commit, giống hệt lượt plan 03c.

| Kiểm chứng | Kết quả |
|---|---|
| `mvn -f backend/pom.xml clean test` (JDK 21.0.11) | **63/63 PASS** |
| Số test trước / sau | 58 → 63 (+5) |
| `LayerDependencyTest` | Xanh |

+5 gồm: `MediaServiceTest` +2 (PNG thật khai sai type, stream đọc thiếu), `MediaControllerTest`
+1 (400 ở tầng HTTP), `GlobalExceptionHandlerTest` +2 (400 và 413). Một test được **đổi tên**,
không phải thêm — nên +5 chứ không phải +6 như plan ước.

### Mutation check — 4/4 ĐỎ

Tôi tự chạy từng cái, backup file rồi khôi phục, không dùng kết quả Antigravity tự báo.

| # | Revert gì | Test | Kết quả |
|---|---|---|---|
| M1 | `media.setMimeType(detectedMimeType)` → `file.getContentType()` | `MediaServiceTest` | **ĐỎ** (6 test, 1 failure) |
| M2 | `in.readNBytes(12)` → `in.read(header)` | `MediaServiceTest` | **ĐỎ** — đúng ca `store_whenStreamReturnsShortReads_stillDetectsWebp` |
| M3 | xoá handler `InvalidRequestException` | `MediaControllerTest` | **ĐỎ** (3 test, 1 failure) |
| M4 | xoá handler `MaxUploadSizeExceededException` | `GlobalExceptionHandlerTest` | **ĐỎ** — `Status expected:<413> but was:<500>` |

M1 là mutation đã bắt ra C-02 ở vòng trước, lần này nhắm đúng nhánh **ghi xuống**. Nó đỏ
nghĩa là C-02 đã đóng thật, không phải đóng trên giấy.

M2 đỏ là điểm đáng kể nhất: `MockMultipartFile` nền byte-array luôn đọc đủ, nên nếu không có
`DripFedMultipartFile` trả tối đa 4 byte mỗi lần đọc thì mutation này sẽ **xanh** và C-03 coi
như chưa được canh gì.

---

## Phát hiện

### D-01 — `@WithMockUser` thừa thêm vào một test cũ (MINOR — **đã sửa trong `c7a3a0d`**)

Lượt viết code thêm `@WithMockUser` vào `validationException_returns400AndDoesNotLog`, một test
đã tồn tại và đang xanh. Test đó gọi `POST /api/auth/login` — endpoint `permitAll` trong
`SecurityConfig`, và ca thật của nó là **người chưa đăng nhập gửi form sai**. Thêm annotation
biến nó thành ca đã đăng nhập, tức là thu hẹp đúng cái nó cần phủ.

Kiểm chứng: bỏ annotation ra, chạy lại `GlobalExceptionHandlerTest` → **6/6 xanh**. Vậy nó
không cần thiết. Đã hoàn nguyên trước khi commit.

Bài học vận hành: lượt giao nào cũng phải `git diff` **cả các file cũ**, không chỉ file mới.
Thay đổi loại này không làm suite đỏ nên không có gì tự báo.

### D-02 — Giới hạn multipart không có gì canh, và nó là cặp hai chỗ (MINOR)

`spring.servlet.multipart.max-file-size: 10MB` và `media.max-size-bytes: 10485760` phải luôn
đi cùng nhau: nếu ai đó nâng `media.max-size-bytes` lên 20MB mà quên `spring.servlet.multipart`,
lỗi (c) quay lại y nguyên — check của `MediaServiceImpl` thành code chết và file 15MB trả 500
kèm một dòng `system_error_logs`. Không test nào phát hiện được vì MockMvc đưa thẳng
`MockMultipartFile` đã parse sẵn cho controller, tầng parse multipart không bao giờ chạy.

Handler 413 thì **có** test (M4 đỏ). Con số thì không ai canh.

Sửa rẻ: một test đọc cả hai property và assert
`multipartMaxFileSize.toBytes() >= mediaStorageProperties.getMaxSizeBytes()`. Ba dòng, và nó
canh đúng cái ràng buộc mà comment trong `application.yml` đang chỉ nói bằng lời.

### D-03 — Tomcat `max-swallow-size` có thể nuốt mất chính cái 413 (INFO, chưa kiểm chứng được)

Khi request vượt `max-file-size`, Spring ném `MaxUploadSizeExceededException` và ta trả 413.
Nhưng Tomcat mặc định `server.tomcat.max-swallow-size` = 2MB: phần body còn lại vượt quá 2MB sẽ
không được đọc hết, và Tomcat đóng kết nối. Với file 15MB, client rất có thể thấy **connection
reset** chứ không thấy 413 của ta.

Không kiểm chứng được ở đây — MockMvc không có connector thật, và chưa có môi trường chạy thật
(không Docker). Ghi lại để **plan 15/16** (Docker + nginx) kiểm bằng một `curl` thật; nếu đúng
thì đặt `server.tomcat.max-swallow-size: -1`, hoặc chặn kích thước ở nginx trước khi tới app.

### D-04 — `InvalidRequestException` echo `ex.getMessage()` ra client (INFO)

Cùng dạng với T-03 đã ghi nhận. Hiện an toàn: cả năm message đều do ta viết, không có mảnh dữ
liệu người dùng nào. Nhưng `InvalidRequestException` giờ là loại dùng chung cho toàn dự án —
plan 07 task 2 sẽ dùng cho lead, plan 08–10 sẽ dùng tiếp. Quy ước cần giữ: **không bao giờ nhét
input của người gửi vào message**, vì nó đi thẳng ra response.

---

## Điều làm tốt

- **`DripFedMultipartFile` làm đúng việc.** Đây là chỗ dễ làm dối nhất trong task: viết một test
  dùng `MockMultipartFile` rồi tuyên bố đã phủ C-03. Mutation M2 chứng minh nó có sức nặng thật.
- **Quyết định (b) được tôn trọng.** Nhánh `SecurityException` giữ nguyên 500 kèm comment WHY
  một dòng, không bị "sửa cho đồng bộ" với các nhánh 400 xung quanh.
- **Handler đặt đúng chỗ** — trên `@ExceptionHandler(Exception.class)`, và cả hai đều có comment
  giải thích vì sao không ghi log row.
- **Đổi tên test cũ thay vì thêm test mới rồi để cái tên sai nằm đó.**
  `store_withSvgContentDeclaredAsPng_isRejected` giờ nói đúng việc nó làm.
- Không đụng `SecurityConfig` như plan dặn.

---

## Kết luận

**VERDICT: Task 1 PASS — `c7a3a0d`, đã đủ điều kiện push cụm.**

C-01, C-02, C-03 đóng thật, có mutation check đỏ chứng minh từng cái. Lỗi (c) tìm ra khi rà plan
cũng đã vá. Hai finding còn lại đều là MINOR/INFO và không chặn.

Điều này mở khoá `e99ae9e` — lý do duy nhất giữ nó ở local là C-01 và C-02.

**Plan 07 chưa xong:** Task 2 (lead + notification) chưa bắt đầu, 0/8 step.

| Finding | Xử lý |
|---|---|
| D-01 | **Đã sửa** trong `c7a3a0d` |
| D-02 | Plan 07 task 2 — thêm test canh cặp `multipart.max-file-size` / `media.max-size-bytes` |
| D-03 | Plan 15/16 — kiểm bằng `curl` thật, cân nhắc `max-swallow-size: -1` hoặc chặn ở nginx |
| D-04 | Ghi nhận, giữ quy ước không nhét input người gửi vào message |
