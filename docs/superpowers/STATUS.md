# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** `523f61f` (đã push lên `origin/master`)
**Working tree:** sạch
**Test:** `mvn -f backend/pom.xml test` (JDK 21.0.11) → **16/16 PASS**, đã chạy lại 2026-09-20

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

**Plan 03b hoàn tất cả 4 task.** Nhưng vòng review 2026-09-20 mở lại 10 finding mới trên chính
hai commit `d06d235` và `ac1808c` — xem bên dưới.

Tiến độ tổng: **3/18 task tính năng**. Chưa có luồng nào dùng được đầu-cuối.

---

## Bước kế tiếp

**`docs/superpowers/plans/2026-09-20-03c-auth-review-fixes-round2.md`** — plan mới, đã viết xong,
chưa implement.

Gồm 7 task, đóng 6 finding ưu tiên cao từ review 2026-09-20:

| Task | Finding | Nội dung |
|---|---|---|
| 1 | R-05 | Chuyển `application-test.yml` khỏi `main/resources` (bẫy mất dữ liệu ở production) |
| 2 | R-01 | Login không được làm bẩn `updated_at` |
| 3 | R-03 | `V2__refresh_token_indexes.sql` — unique index `token_hash`, index `expires_at` |
| 4 | R-02 | Job dọn token dùng bulk JPQL thay vì derived delete |
| 5 | R-04 | Token bị replay → revoke toàn bộ token còn sống của user |
| 6 | R-07 | Test cho nhánh "user bị deactivate thì không refresh được" |
| 7 | — | Mutation check 4 test mới, rồi commit |

Sau 03c mới tới **plan 04**.

### Plan 04 — ĐÃ SỬA XONG 2026-09-20, sẵn sàng implement

Ba vấn đề ghi trong STATUS hôm qua **đã được vá vào file plan**, cộng thêm một vấn đề thứ tư mới
phát hiện. Chi tiết trong mục "Revision log" đầu file
`docs/superpowers/plans/2026-09-19-04-audit-error-logging.md`:

1. Test aspect kiểu tautology (`new SampleService()` né proxy, assert `count() >= 0`) → thay bằng
   bean do `@TestConfiguration` cấp và assert đúng `before + 1`.
2. `@ExceptionHandler(Exception.class)` nuốt `AccessDeniedException` → thêm handler riêng
   *rethrow* để `ExceptionTranslationFilter` trả đúng 403.
3. F-05 chưa phủ → thêm handler 400 cho `MethodArgumentNotValidException`, và sửa
   `SecurityConfig` để 401/403 từ filter chain cũng có body `ApiError` (hiện `HttpStatusEntryPoint`
   trả body rỗng).
4. **(mới)** `AuditAspect` không bao giờ resolve `user_id` — thân hàm cũ có
   `if (auth != null) { log.setUserId(null); }`, code chết. `JwtAuthFilter` đặt principal là
   *username*, nên phải tra `UserRepository`.

---

## Finding còn mở

### Từ review 2026-09-20 (`docs/reviews/2026-09-20-code-review-03b-self-implemented.md`)

| Mã | Mức | Nội dung | Xử lý ở đâu |
|---|---|---|---|
| R-01 | MAJOR | `login` gọi `save()` → `@PreUpdate` bắn → `updated_at` bám theo mỗi lần đăng nhập | plan 03c task 2 |
| R-02 | MAJOR | `deleteByExpiresAtBefore` là derived delete: SELECT rồi DELETE từng row (đã đo SQL) | plan 03c task 4 |
| R-03 | MAJOR | `refresh_tokens.token_hash` không index, không UNIQUE → full scan mỗi lượt refresh | plan 03c task 3 |
| R-04 | MAJOR | Token bị replay chỉ bị 401, token của kẻ trộm vẫn sống 7 ngày | plan 03c task 5 |
| R-05 | MAJOR | `application-test.yml` nằm trong `main/resources` → lọt vào jar production | plan 03c task 1 |
| R-06 | MINOR | Test dọn token dùng `userId(1L)` vi phạm FK thật; chỉ xanh vì Flyway tắt | thuộc F-01 |
| R-07 | MINOR | Chưa có test cho `.filter(User::isActive)` trong `rotate()` | plan 03c task 6 |
| R-08 | MINOR | Không giới hạn số refresh token sống mỗi user | hoãn, gắn plan 09 |
| R-09 | MINOR | Test job không chứng minh `@EnableScheduling` / cron còn đó | hoãn |
| R-10 | INFO | H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` | thuộc F-08 |

### Từ các vòng trước

| Mã | Nội dung | Chặn ở đâu |
|---|---|---|
| F-01 | Flyway migration và entity chưa từng được đối chiếu | Cần Testcontainers + Docker daemon. **Phải đóng trước plan 15.** R-06 và R-10 là hai ca cụ thể. |
| F-05 | Response lỗi chưa đúng shape JSON của spec | Plan 04 (đã sửa plan để phủ đủ 400/401/403/500) |
| F-08 | `TIMESTAMP` vs `Instant` lệch timezone | Thay đổi toàn schema, nên chốt trước lần deploy thật |
| F-09 | JWT còn sống tối đa 15 phút sau khi user bị deactivate | Chấp nhận theo spec. Plan 10 phải ghi rõ deactivate không tức thời. |

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

**Suite chạy trên H2, Flyway tắt.** `mvn test` xanh **không** nói lên điều gì về
`V1__init_schema.sql`. Bất kỳ thay đổi schema nào cũng phải kiểm bằng tay với Postgres thật —
cách làm ghi trong plan 03c task 3 step 2.

---

## Tình trạng công cụ

**Antigravity không dùng được.** Hai lượt bàn giao đều trả:

```
exit code 3
RESOURCE_EXHAUSTED (code 429): Individual quota reached.
Resets in 164h48m16s.   retryable: true
```

Lượt thứ hai đếm ngược `164h34m29s`, ít hơn lượt đầu đúng `13m47s` — bằng khoảng thời gian thật
giữa hai lần gọi. Nghĩa là **mốc reset là một thời điểm cố định phía server; lỗi này thật và ổn
định, không phải trục trặc ngẫu nhiên.** Cờ `retryable: true` gây hiểu nhầm.

App GUI của người dùng vẫn hiển thị quota 100% — hai nguồn tin mâu thuẫn. Nhiều khả năng CLI
headless xác thực bằng credential khác với account đang login GUI. Cần kiểm tra ngoài workspace,
Claude không có quyền đọc chỗ đó.

**Mốc reset ước tính: 2026-09-26.**

Vì Antigravity chặn, task 2 và 3 của plan 03b do Claude tự implement **có sự cho phép của người
dùng**. Review 2026-09-20 vẫn là cùng một tác nhân, nên vẫn **chưa phải review độc lập** — 10
finding ở trên là những gì một lượt rà lại kỹ hơn tìm ra, không phải là bằng chứng rằng code đã
sạch.
