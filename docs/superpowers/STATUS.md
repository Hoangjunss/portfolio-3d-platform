# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-19
**Commit cuối:** `9976684` (đã push lên `origin/master`)
**Working tree:** sạch, không có gì chưa commit
**Test:** `mvn -f backend/pom.xml test` → **16/16 PASS**

---

## Đã xong

| Plan | Nội dung | Commit |
|---|---|---|
| 01 | Scaffold Spring Boot + Flyway baseline | `d73d13a` |
| 02 | `User` entity, `Role`, `UserRepository` | `ba63aa8` |
| 03 | JWT login + security config | `6cd2521` |
| 03b task 1 | Default-deny security chain, `/error` vẫn reachable | `651d46f` |
| 03b task 2 | Refresh token lifecycle đầy đủ | `d06d235` |
| 03b task 3 | `updatedAt` / `lastLoginAt` trung thực | `ac1808c` |

**Plan 03b hoàn tất cả 4 task.** Chi tiết kiểm chứng trong
`docs/reviews/2026-09-19-code-review-task-03b.md` (3 vòng review).

Tiến độ tổng: **3/18 task tính năng**. Chưa có luồng nào dùng được đầu-cuối.

---

## Bước kế tiếp

`docs/superpowers/plans/2026-09-19-04-audit-error-logging.md`.

**Plan 04 CẦN SỬA TRƯỚC KHI IMPLEMENT** — ba vấn đề đã phát hiện, chưa sửa vào file plan:

1. **Step 2 là test giả.** `AuditAspectTest` khởi tạo `new SampleService()` trực tiếp nên né
   proxy AOP, rồi assert `count() >= 0` — luôn xanh kể cả khi `AuditAspect` không tồn tại. Đúng
   loại "test rỗng" mà R-03 (review vòng 1) đã bắt một lần. Phải viết lại bằng bean do Spring
   quản lý và assert số row tăng đúng 1.
2. **`GlobalExceptionHandler` bắt `Exception.class`** sẽ nuốt luôn `AccessDeniedException`, biến
   403 thành 500 và ghi nhầm vào `system_error_logs`.
3. **F-05 chưa được phủ.** Review tasks 01–03 yêu cầu `@RestControllerAdvice` của plan 04 phải
   phủ cả `MethodArgumentNotValidException` (400) và các 401 mà plan 03b sinh ra, không chỉ 5xx.

---

## Finding còn mở

| Mã | Nội dung | Chặn ở đâu |
|---|---|---|
| F-01 | Flyway migration và entity chưa từng được đối chiếu | Cần Testcontainers + Docker daemon. **Phải đóng trước plan 15.** |
| F-05 | Response lỗi chưa đúng shape JSON của spec | Thuộc plan 04 |
| F-08 | `TIMESTAMP` vs `Instant` lệch timezone | Thay đổi toàn schema, nên chốt trước lần deploy thật |
| F-09 | JWT còn sống tối đa 15 phút sau khi user bị deactivate | Chấp nhận theo spec. Plan 10 phải ghi rõ deactivate không tức thời. |
| — | Chưa có test cho nhánh "user bị deactivate thì không refresh được" | Logic đã có trong `RefreshTokenService.rotate()`, thiếu test bảo vệ. Nên bổ sung trước plan 10. |

---

## Bẫy môi trường

**`JAVA_HOME` mặc định của máy trỏ `C:\Program Files\Java\jdk1.8.0_202`.** Maven chạy với JDK 8
sẽ báo `class, interface, or enum expected` trên mọi `record` — trông như lỗi cú pháp nhưng thực
ra là sai JDK. Luôn export trước khi build:

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

JDK có sẵn trên máy: `jdk1.8.0_202`, `jdk-11.0.31`, `jdk-21.0.11`.

---

## Tình trạng công cụ

**Antigravity không dùng được.** Lượt bàn giao plan 03b task 2 trả về:

```
exit code 3
RESOURCE_EXHAUSTED (code 429): Individual quota reached.
Resets in 164h48m16s.   retryable: true
```

Người dùng kiểm tra phía app thì thấy quota **vẫn còn 100%** — hai nguồn tin mâu thuẫn, chưa phân
xử được. Giả thuyết: CLI headless dùng credential khác với app GUI, hoặc khác bucket quota, hoặc
lỗi server báo sai. Cờ `retryable: true` nghĩa là **đáng thử lại**, chưa nên coi là chết 7 ngày.

Vì Antigravity chặn, task 2 và task 3 của plan 03b do Claude tự implement, **có sự cho phép của
người dùng**. Hệ quả cần biết: review vòng 3 là **tự kiểm, không độc lập** — nên có một lượt
review độc lập cho `d06d235` và `ac1808c` trước khi plan 04 bắt đầu.
