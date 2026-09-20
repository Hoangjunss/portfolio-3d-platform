# Code review — plan 26 backend (error log viewer), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `9b5fac1`
**Kết quả:** **174/174 PASS, BUILD SUCCESS** (167 nền + 7 test mới). Không finding nào.
Bẫy `Create:` đã được chặn từ trước và không phát nổ.

## Bẫy `Create:` — lần này chặn trước, không phải phát hiện sau

Ở plan 25 tôi phát hiện bẫy **sau khi** code đã viết. Lần này tôi kiểm `git log --diff-filter=A`
**trước** khi giao, thấy `SystemErrorLogService` và `SystemErrorLogServiceImpl` đã tồn tại, và vá
nhãn plan kèm cảnh báo ở `d96d021`.

Kết quả đúng như mong muốn — diff là **thêm thuần**:

    SystemErrorLogService.java     |  6 ++
    SystemErrorLogServiceImpl.java | 16 ++-

Dòng `-1` duy nhất là chữ ký constructor cũ, thay bằng bản hai tham số để nhận thêm converter. Hai
overload `record(...)` còn nguyên:

```java
void record(String endpoint, int httpStatus, Exception ex, String requestId);
void record(String endpoint, int httpStatus, String exceptionClass, String message, String stacktrace, String requestId);
Page<SystemErrorLogDto> list(Pageable pageable);   // <- mới
```

**Kiểm bằng hành vi, không bằng mắt:** đường ghi 5xx được `GlobalExceptionHandlerTest` và
`ErrorDispatchSecurityTest` phủ, cả hai nằm trong 174/174 xanh. Tức nó còn **chạy**, không chỉ còn
biên dịch được.

## Ba ràng buộc

| Ràng buộc | Kiểm |
|---|---|
| Read-only, không tự ghi log | không `@Audited`; có test `list_isReadOnly_doesNotWriteSystemErrorLog` |
| Phân trang dựa trần toàn cục | `@PageableDefault(size = 20, sort = "createdAt", DESC)` + `max-page-size: 100` sẵn có |
| Không khai thêm security | không có; `SecurityConfig` chặn `/api/admin/**` theo pattern |

Test `list_isReadOnly_doesNotWriteSystemErrorLog` đặc biệt đúng chỗ ở đây: một endpoint **đọc** bảng
lỗi mà lại tự ghi vào chính bảng đó sẽ tạo vòng lặp phản hồi.

## Test — 5 case, khuôn giống hệt plan 25

    list_unauthenticated_returns401
    list_cannotBeAskedForAnUnboundedPage
    list_isReadOnly_doesNotWriteSystemErrorLog
    list_returnsPagedNewestFirst_withFullStackTrace
    list_asEditor_returns200

Cộng 2 test converter. Khuôn nhất quán với `AdminAuditLogControllerTest` — dấu hiệu nó đọc mẫu gần
nhất trong repo thay vì tự nghĩ ra.

## Quan sát nhỏ — thứ tự sắp xếp bị khai hai lần

Repository dùng `findAllByOrderByCreatedAtDesc(pageable)`, tức thứ tự đã bị ghim trong **tên
method**. Controller lại khai thêm `@PageableDefault(sort = "createdAt", direction = DESC)`.

Hệ quả: `?sort=httpStatus,asc` từ client sẽ **không** đổi được thứ tự chính — Spring Data ghép thứ
tự tĩnh của tên method lên trước, tham số `sort` chỉ thành khoá phụ. API trông như nhận `sort`
nhưng thực tế không cho ghi đè.

Không hại: newest-first là thứ tự duy nhất hợp lý cho màn log lỗi, và plan đòi đúng thế. Nhưng khác
với `AdminAuditLogController` liền kề, nơi repository **không** ghim `OrderBy` nên `sort` hoạt động
thật. Hai endpoint anh em hành xử khác nhau với cùng một tham số.

Ghi lại, không sửa: bỏ `OrderBy` khỏi tên method sẽ làm thứ tự phụ thuộc hoàn toàn vào
`@PageableDefault`, một thay đổi hành vi cần plan riêng.

## Ship

Đã push. Task frontend của plan 26 cần giao riêng.
