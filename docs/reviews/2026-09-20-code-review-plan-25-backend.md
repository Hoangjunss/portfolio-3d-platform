# Code review — plan 25 backend, lượt 1: **PASS**, và nó tránh được một bản plan phá hoại

**Ngày:** 2026-09-20
**Commit:** `a2a5228`
**Kết quả:** **167/167 PASS, BUILD SUCCESS** (150 nền + 17 test mới). Không finding nào trong code.
**Finding nằm ở plan** — và nếu làm đúng theo plan thì đã hỏng cả hệ thống audit.

## Điểm đáng kể nhất: plan ghi `Create:` cho 4 file đã tồn tại

Plan liệt kê 6 file `Create:`. Thực tế:

| File | Tạo ở commit |
|---|---|
| `AuditLogDto` | `a2a5228` — mới thật ✅ |
| `AdminAuditLogController` | `a2a5228` — mới thật ✅ |
| `AuditLogConverter` | **`382f0e6`** — đã có |
| `AuditLogConverterImpl` | **`382f0e6`** — đã có |
| `AuditLogService` | **`382f0e6`** — đã có |
| `AuditLogServiceImpl` | **`382f0e6`** — đã có |

Bốn file cuối có từ plan 04b (layered refactor). `AuditLogServiceImpl` đang giữ:

```java
@Transactional
public void record(String entityType, String action, Long entityId, Long userId, String ipAddress) {
    AuditLog log = auditLogConverter.toEntity(entityType, action, entityId, userId, ipAddress);
    auditLogRepository.save(log);
}
```

Đây là method mà aspect `@Audited` gọi để ghi **mọi** dòng `audit_logs` trong toàn ứng dụng.

Làm đúng chữ `Create:` — tức viết file mới chỉ có `list()` — sẽ **xoá `record()`**. Hậu quả: audit
log của templates, users, content, settings, media **ngừng ghi trong im lặng**. Không lỗi biên dịch
ở phía main, chỉ có một bảng dần rỗng.

**Lượt giao không làm theo.** Nó mở rộng file sẵn có thay vì ghi đè. Bằng chứng khách quan: suite
đầy đủ 167/167 xanh, trong đó có `deleteMedia_returns204AndWritesAuditLogRow` — test đếm số dòng
`audit_logs` trước/sau. Test đó còn xanh nghĩa là đường ghi còn nguyên.

Đã vá nhãn trong plan kèm cảnh báo, để lần chạy lại không phá.

Cùng họ với M1 của plan 18b và C-04 của plan 20/21: **plan mô tả repo theo trí nhớ, không theo repo.**
Đây là lần hậu quả nặng nhất.

## Ba ràng buộc tôi nêu — đúng cả ba

| Ràng buộc | Kiểm |
|---|---|
| Endpoint read-only, **không** tự ghi `audit_logs` | không có `@Audited` trên `list`; và có hẳn test `list_isReadOnly_doesNotWriteAuditLog` |
| Phân trang + trần page size toàn cục | `@PageableDefault(size = 20, sort = "createdAt", DESC)` + `max-page-size: 100` sẵn có |
| Không khai thêm security | không có; `SecurityConfig` đã chặn `/api/admin/**` theo pattern |

`@Transactional(readOnly = true)` trên `list`, `@Transactional` trên `record` — đúng chiều.

## `entityType` bắt buộc — đúng chủ ý plan, không phải cứng nhắc

`@RequestParam String entityType` không có `required = false`, nên thiếu param là 400. Ban đầu tôi
nghi đây là lỗi — một màn "xem audit log" mà không mở được nếu chưa biết lọc gì thì kỳ. Nhưng plan
dòng 57-60 đã quyết và lập luận đúng:

> relying on insertion order instead of filtering by `entityType`/`entityId` ... is fragile once the
> table has many writers (templates, users, content, settings, media all write here).
> **Every query in this plan filters explicitly by `entityType` (required)**. Never rely on row
> order or `findAll()`.

Service còn chặn thêm chuỗi rỗng (`?entityType=`) bằng `InvalidRequestException`, tức cả hai đường
vào đều ra 400. Có test cho từng đường.

## Test — 9 case, nhắm thẳng vào ràng buộc

    list_unauthenticated_returns401
    list_returns400_whenEntityTypeMissing
    list_returns400_whenEntityTypeBlank
    list_cannotBeAskedForAnUnboundedPage
    list_filtersByEntityTypeOnly_whenEntityIdOmitted
    list_filtersByEntityTypeAndEntityId_whenBothProvided
    list_ordersByCreatedAtDescByDefault
    list_asEditor_returns200
    list_isReadOnly_doesNotWriteAuditLog

Hai cái cuối đáng chú ý: một cái xác nhận EDITOR đọc được (khớp `SecurityConfig`), một cái chứng
minh tính read-only bằng hành vi chứ không bằng việc "không thấy annotation".

## Ship

Đã push kèm bản vá nhãn plan. Task frontend của plan 25 cần giao riêng.
