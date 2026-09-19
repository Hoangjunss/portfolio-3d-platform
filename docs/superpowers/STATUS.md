# Trạng thái dự án — portfolio-3d-platform

**Cập nhật:** 2026-09-20
**Commit cuối:** xem `git log -1` — plan 03c vừa được commit
**Working tree:** sạch
**Test:** `mvn -f backend/pom.xml test` (JDK 21.0.11) → **20/20 PASS**

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
| 03c | Đóng R-01, R-02, R-04, R-05, R-07 (R-03 còn treo) | commit này |

Tiến độ tổng: **3/18 task tính năng**. Chưa có luồng nào dùng được đầu-cuối.

**Plan 03c là lần đầu dự án có review độc lập** — Antigravity viết code, Claude review. Năm lượt
trước đó đều là tự kiểm.

---

## Bước kế tiếp

**`docs/superpowers/plans/2026-09-19-04-audit-error-logging.md`** — đã sửa xong 2026-09-20,
**sẵn sàng implement**, không còn vướng gì.

Bốn vấn đề của plan 04 đã được vá vào chính file plan (mục "Revision log" ở đầu file):

1. Test aspect kiểu tautology → thay bằng bean do `@TestConfiguration` cấp, assert đúng `before + 1`.
2. `@ExceptionHandler(Exception.class)` nuốt `AccessDeniedException` → thêm handler *rethrow*.
3. F-05 chưa phủ → thêm handler 400, và sửa `SecurityConfig` để 401/403 cũng có body `ApiError`.
4. `AuditAspect` không resolve `user_id` (code chết) → phải tra `UserRepository` theo username.

---

## Finding còn mở

| Mã | Mức | Nội dung | Chặn ở đâu |
|---|---|---|---|
| **R-03** | MAJOR | `V2__refresh_token_indexes.sql` đã viết nhưng **chưa từng chạy** — máy không có Docker (`docker: command not found`), suite thì tắt Flyway. File đúng nội dung, chỉ là chưa kiểm chứng | Cần Postgres thật hoặc Testcontainers. Gắn với F-01 |
| **V-02** | MINOR | `revoked` gộp hai nguyên nhân khác hẳn nhau: bị rotate (rò rỉ) và bị logout (user chủ động). Refresh sau logout vì vậy kích hoạt family revocation và giết session các thiết bị khác | Cần cột `revoked_reason`. Gộp vào cùng đợt migration với R-03 |
| R-06 | MINOR | Test dọn token dùng `userId(1L)` vi phạm FK thật; chỉ xanh vì Flyway tắt | Thuộc F-01 |
| R-08 | MINOR | Không giới hạn số refresh token sống mỗi user | Hoãn, gắn plan 09 |
| R-09 | MINOR | Test job không chứng minh `@EnableScheduling` / cron còn đó | Hoãn |
| R-10 | INFO | H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` | Thuộc F-08 |
| V-03 | NIT | `UserRepository.java` thừa một dòng trống cuối file | Dọn khi nào chạm file |
| F-01 | — | Flyway migration và entity chưa từng được đối chiếu | Cần Testcontainers + Docker. **Phải đóng trước plan 15.** R-03, R-06, R-10 đều là ca cụ thể |
| F-05 | — | Response lỗi chưa đúng shape JSON của spec | Plan 04 |
| F-08 | — | `TIMESTAMP` vs `Instant` lệch timezone | Chốt trước lần deploy thật |
| F-09 | — | JWT còn sống tối đa 15 phút sau khi user bị deactivate | Chấp nhận theo spec. Plan 10 phải ghi rõ deactivate không tức thời |

### Đã đóng trong 03c

R-01 (`login` làm bẩn `updated_at`), R-02 (derived delete nạp từng row), R-04 (replay không bị xử
lý), R-05 (`application-test.yml` lọt vào jar production), R-07 (thiếu test cho
`.filter(User::isActive)`).

Cả bốn test mới **đã qua mutation check** — revert đúng thay đổi production tương ứng thì mỗi test
đỏ đúng một mình. Chi tiết trong `docs/reviews/2026-09-20-code-review-plan-03c.md`.

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

**Không có Docker trên máy này.** `docker: command not found`. Mọi bước kiểm chứng cần Postgres
thật đều đang treo, và F-01 không thể đóng cho tới khi có.

**Suite chạy trên H2, Flyway tắt.** `mvn test` xanh **không** nói lên điều gì về
`V1__init_schema.sql` hay `V2__refresh_token_indexes.sql`.

---

## Tình trạng công cụ

**Antigravity đã dùng lại được, từ 2026-09-20.** Lượt bàn giao plan 03c chạy thành công và trả về
code đầy đủ cho cả 6 task code. Dự đoán trước đó là quota reset khoảng 2026-09-26 — **sai**, nó
mở sớm hơn. Hai lượt hỏng ngày 2026-09-19 (`RESOURCE_EXHAUSTED`, đếm ngược ~164h) vẫn chưa có lời
giải thích, nhưng không còn chặn việc gì nữa.

Một lưu ý về bàn giao: Antigravity làm đúng 6 task code nhưng **bỏ qua task 7 step 2
(mutation check) và step 3 (commit)**. Claude chạy mutation check thay và commit. Lần bàn giao
sau nên kiểm lại hai bước cuối thay vì mặc định là đã xong.
