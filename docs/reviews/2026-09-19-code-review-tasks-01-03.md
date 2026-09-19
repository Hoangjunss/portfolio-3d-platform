# Code Review — Tasks 01–03 (backend scaffold, user, JWT auth)

**Ngày:** 2026-09-19
**Phạm vi:** commit `d73d13a`, `ba63aa8`, `6cd2521`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-01..03-*.md`
**Spec đối chiếu:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn test` (JDK 21) | 6/6 PASS |
| Tiêu chí chấp nhận task 01 bước 8 (Flyway chạy trên Postgres thật) | **CHƯA kiểm chứng** — máy không có Docker |
| Entity ↔ `V1__init_schema.sql` khớp nhau | **CHƯA kiểm chứng** — xem F-01 |

---

## Phát hiện

### F-01 — Migration và entity chưa bao giờ được đối chiếu với nhau (nghiêm trọng)

`application-test.yml` đặt `flyway.enabled: false` và `ddl-auto: create-drop`. Nghĩa là schema
trong test được **sinh ra từ entity**, không phải từ `V1__init_schema.sql`. Lệch giữa hai nguồn
sẽ không test nào bắt được; production dùng `ddl-auto: validate` nên lỗi chỉ lộ ra lúc boot thật.

Plan 01 có bước 8 để chặn đúng chuyện này (chạy app trên Postgres thật) nhưng bước đó cần Docker.

**Sửa:** thêm một integration test dùng Testcontainers Postgres, chạy Flyway thật rồi để Hibernate
`validate`. Cần Docker → đang bị chặn.

### F-02 — Refresh token được phát ra nhưng không có đường nào đổi lấy access token mới (nghiêm trọng)

Mục tiêu plan 03 ghi "login with JWT access + refresh tokens". Hiện tại:

- `AuthController` sinh refresh token, hash SHA-256, lưu DB, trả về client — OK.
- Nhưng **không có endpoint `/api/auth/refresh`**. Client cầm refresh token mà không dùng được.
- `RefreshTokenRepository.findByTokenHashAndRevokedFalse` viết ra rồi không ai gọi — dead code.
- `JwtProperties.refreshSecret` khai báo rồi không dùng — `JwtService` chỉ dựng `accessKey`.

Hệ quả: access token hết hạn sau 15 phút là người dùng bị đá ra, phải đăng nhập lại.

Đây là thiếu sót của bản thân plan 03, không phải lỗi khi thực thi plan.

**Sửa:** bổ sung `POST /api/auth/refresh` + `POST /api/auth/logout` (revoke). Nên làm trước khi
plan 13 (admin auth middleware) dựng luồng đăng nhập ở frontend.

### F-03 — `.anyRequest().permitAll()` khiến endpoint admin đặt sai chỗ sẽ âm thầm mở công khai (bảo mật)

`SecurityConfig` kết thúc chain bằng `.anyRequest().permitAll()`. Chỉ đường dẫn khớp
`/api/admin/**` mới được bảo vệ. Plan 05–10 còn thêm rất nhiều controller; chỉ cần một cái đặt
ngoài tiền tố `/api/admin/**` là nó public mà không có gì báo.

Self-review note của plan 03 có nhắc rủi ro này nhưng code không có phòng vệ nào.

**Sửa:** đổi mặc định thành `.anyRequest().authenticated()` và khai báo tường minh danh sách
đường dẫn public. Mặc định đóng, mở có chủ đích.

### F-04 — `users.last_login_at` và `users.updated_at` không bao giờ được cập nhật

- Login thành công không set `lastLoginAt`, dù cột có trong schema và spec mục 6 liệt kê nó.
- `createdAt`/`updatedAt` chỉ được gán lúc khởi tạo field (`Instant.now()`), không có `@PreUpdate`.
  Mọi lần sửa user về sau, `updated_at` sẽ đứng yên ở thời điểm tạo.

**Sửa:** thêm `@PreUpdate` (hoặc `@EntityListeners(AuditingEntityListener.class)`) và set
`lastLoginAt` trong `AuthController.login`. Ảnh hưởng plan 10 (user management).

### F-05 — 401 trả về body rỗng, trái spec mục 8

Spec yêu cầu mọi lỗi API trả JSON có cấu trúc (`code`, `message`, `requestId`).
`ResponseEntity.status(401).build()` trả body rỗng. Tương tự, `@Valid` thất bại sẽ cho
`MethodArgumentNotValidException` với body mặc định của Spring.

Plan 04 dựng `@ControllerAdvice` — cần bảo đảm nó phủ luôn hai trường hợp này, không chỉ 5xx.

### F-06 — `refresh_tokens` chỉ có đường ghi vào, không có đường dọn (nhẹ)

Mỗi lần login chèn một hàng; không có logout, không có revoke, không có job xoá token hết hạn.
Bảng chỉ phình ra. Trên VPS 2GB thì đây là rác tích luỹ chậm nhưng chắc chắn.

**Sửa:** gộp chung với F-02 (logout/revoke) + một job dọn token quá hạn.

### F-07 — `sha256()` dùng charset mặc định của platform (nhẹ)

`digest.digest(value.getBytes())` — `getBytes()` không chỉ định charset. Hiện token là Base64URL
thuần ASCII nên không sai kết quả, nhưng đây là lỗi tiềm ẩn kinh điển. Dùng
`StandardCharsets.UTF_8` cho nhất quán với `JwtService`.

### F-08 — Kiểu thời gian trộn hai nguồn (nhẹ, cần theo dõi)

Schema dùng `TIMESTAMP` (không timezone) với `DEFAULT now()` — giờ của server DB.
Entity dùng `Instant` — UTC. Hai nguồn sinh giá trị khác nhau cho cùng một cột.
Nếu VPS chạy giờ Việt Nam, giá trị do DB sinh và giá trị do app sinh sẽ lệch 7 tiếng.

**Sửa:** thống nhất `TIMESTAMPTZ`, hoặc bỏ hẳn `DEFAULT now()` và để app là nguồn duy nhất.

### F-09 — Token vẫn sống 15 phút sau khi user bị vô hiệu hoá (chấp nhận được, ghi nhận)

`isActive` chỉ được kiểm lúc login. `JwtAuthFilter` tin hoàn toàn vào chữ ký token.
Đây là đánh đổi cố hữu của JWT stateless, phù hợp với spec. Ghi lại để plan 10 biết rằng
"deactivate user" không có hiệu lực tức thì.

---

## Lệch so với plan (đã ghi trong commit message)

| Plan | Chỗ lệch | Lý do |
|---|---|---|
| 01 | `bucket4j_jdk17-core` 8.10.1 → 8.14.0 | 8.10.1 chưa từng publish; artifact `_jdk17` chỉ có từ 8.11.0 |
| 03 | Thêm `@ConfigurationPropertiesScan` | `JwtProperties` là record `@ConfigurationProperties`, plan không đăng ký bean ở đâu → context không khởi động |

---

## Kết luận về việc ship

**Chưa ship được.** Lý do, theo thứ tự chặn:

1. 3/18 task — chưa có tính năng nào dùng được đầu-cuối. Chưa có template CRUD, chưa có frontend.
2. F-01: chưa có gì bảo đảm migration chạy được trên Postgres thật.
3. F-03: cấu hình bảo mật mặc định-mở, sẽ thành nợ nguy hiểm khi plan 05–10 thêm controller.
4. F-02: luồng auth chưa hoàn chỉnh.
5. Chưa có remote GitHub (token `gh` hỏng), chưa có CI (plan 17), chưa có Docker (plan 15).

**Nên làm trước khi đi tiếp task 04:** sửa F-03 (rẻ, một dòng), F-04 và F-07 (rẻ). F-02 nên gộp
vào một task bổ sung cho plan 03. F-01 chờ Docker.
