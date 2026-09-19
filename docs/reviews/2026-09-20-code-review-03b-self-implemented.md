# Code Review — commit `d06d235` + `ac1808c` (vòng rà lại code tự implement)

**Ngày:** 2026-09-20
**Phạm vi:** `git diff 651d46f..ac1808c` — plan 03b task 2 (refresh token lifecycle) và task 3
(user timestamps)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-03b-auth-hardening-review-fixes.md`
**Review trước đó:** `docs/reviews/2026-09-19-code-review-task-03b.md` (3 vòng)

## Tại sao có vòng này

Hai commit trên do Claude tự viết vì Antigravity trả `RESOURCE_EXHAUSTED`. Review vòng 3 trong
file trước vì vậy là **tự kiểm chứ không độc lập** — người viết code và người review là một.
Vòng này vẫn không giải quyết được vấn đề đó (vẫn cùng một tác nhân), nhưng được làm với con mắt
mới, chạy lại toàn bộ suite, và **có đo SQL thật** thay vì chỉ đọc code. Khi nào có người review
thứ hai thật sự thì vẫn nên chạy lại.

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **16/16 PASS**, exit 0 |
| Working tree | sạch |
| F-02 (không redeem được refresh token) | **đã đóng** — `POST /api/auth/refresh` có thật, có test |
| F-06 (`refresh_tokens` phình vô hạn) | **đóng một nửa** — xem R-02, R-08 |
| F-07 (sha256 dùng charset mặc định) | **đã đóng** — `StandardCharsets.UTF_8`, `RefreshTokenService.java:84` |
| F-04 (`updated_at` chết cứng) | **đóng nhưng sinh lỗi mới** — xem R-01 |

Suite xanh. Nhưng suite chạy trên H2 với `ddl-auto: create-drop` và **Flyway tắt** — tức là
không một dòng nào của `V1__init_schema.sql` được chạm tới. Xem R-05, R-06, R-10.

---

## Phát hiện

### R-01 — `updated_at` giờ nhảy theo mỗi lần đăng nhập (MAJOR, lỗi mới do `ac1808c` gây ra)

`AuthController.login` (`AuthController.java:37-38`) set `lastLoginAt` rồi gọi
`userRepository.save(user)`. Lệnh save đó là một UPDATE, nên `@PreUpdate touchUpdatedAt()`
(`User.java:44-47`) bắn theo.

Hệ quả: với mọi tài khoản còn hoạt động, `updated_at` ≈ `last_login_at` vĩnh viễn. Cột
`updated_at` mất đúng cái ý nghĩa duy nhất của nó — "hồ sơ bị sửa lần cuối lúc nào". Commit
`ac1808c` tự mô tả là "honest user timestamps"; nó sửa một cột và làm bẩn cột còn lại.

Đây không phải lỗi lý thuyết: **plan 10 hiển thị cả hai cột cạnh nhau trong admin UI.** Hai cột
luôn bằng nhau thì admin không có cách nào biết ai vừa bị đổi quyền.

Cách sửa (chọn một):
- `@Modifying @Query("update User u set u.lastLoginAt = :now where u.id = :id")` — JPQL bulk
  update không bắn callback, đúng ngữ nghĩa ở đây.
- Hoặc tách `last_login_at` sang bảng/entity riêng.

Không dùng cách "set lại `updatedAt` về giá trị cũ sau khi save" — nó vẫn ghi đè cột trong cùng
lệnh UPDATE, chỉ che lỗi.

### R-02 — Job dọn token nạp từng row vào heap rồi xoá từng cái (MAJOR)

`RefreshTokenRepository.deleteByExpiresAtBefore` là **derived delete** của Spring Data. Chú thích
`@Modifying` không biến nó thành bulk DML — `@Modifying` chỉ có tác dụng với `@Query`. Spring Data
SELECT toàn bộ row khớp, materialise thành entity, rồi `em.remove()` từng cái.

Đo thật, chạy `RefreshTokenCleanupJobTest` với `-Dspring.jpa.show-sql=true`:

```
select rt1_0.id,rt1_0.created_at,rt1_0.expires_at,rt1_0.revoked,rt1_0.token_hash,rt1_0.user_id
  from refresh_tokens rt1_0 where rt1_0.expires_at<?
delete from refresh_tokens where id=?
```

Một SELECT rồi N lệnh DELETE riêng lẻ. Spec section 7 chốt ngân sách `-Xmx350m`; job này chạy
03:30 hằng ngày và nạp **toàn bộ** token hết hạn vào heap cùng lúc. Với TTL 7 ngày và không giới
hạn token mỗi user (R-08), số row đó không có trần.

Sửa:

```java
@Modifying
@Transactional
@Query("delete from RefreshToken t where t.expiresAt < :cutoff")
int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
```

### R-03 — `refresh_tokens.token_hash` không có index (MAJOR)

`V1__init_schema.sql:16` khai `token_hash VARCHAR(255) NOT NULL` — không UNIQUE, không index.
Mọi lượt `POST /api/auth/refresh` và `POST /api/auth/logout` đều gọi
`findByTokenHashAndRevokedFalse`, tức là **quét tuần tự toàn bảng**, trên bảng chỉ được dọn mỗi
ngày một lần.

Thiếu UNIQUE cũng nghĩa là không có gì ở tầng DB chặn hai row cùng hash. Xác suất đụng độ của 32
byte ngẫu nhiên là không đáng kể, nhưng UNIQUE ở đây rẻ và biến một bug logic tiềm tàng thành lỗi
ghi rõ ràng.

Cần `V2__refresh_token_index.sql`:

```sql
CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
```

Index thứ hai phục vụ chính job ở R-02.

### R-04 — Token bị replay không kích hoạt xử lý gì (MAJOR)

`RefreshTokenService.rotate()` (`:47-64`) khi gặp token đã revoked chỉ trả `Optional.empty()` →
401. Thông điệp commit `d06d235` viết: *"a stolen token works at most once and the legitimate
client's next 401 is the detection signal"*. Vế đầu đúng. Vế sau **nói quá**: hệ thống nhận được
tín hiệu đó rồi không làm gì cả.

Kịch bản: kẻ tấn công trộm refresh token, dùng trước client thật. Kẻ đó có token mới còn sống 7
ngày. Client thật refresh, ăn 401, phải đăng nhập lại — và token của kẻ tấn công **vẫn sống**.
401 phía client là tín hiệu mạnh nhất hệ thống từng có về việc token bị lộ, và nó bị vứt đi.

Xử lý chuẩn: khi thấy một token đã revoked được trình ra, revoke **toàn bộ** token còn sống của
user đó (reuse detection → family revocation). Cần `revokeAllForUser(Long userId)` và một nhánh
riêng trong `rotate()` phân biệt "không tìm thấy" với "tìm thấy nhưng đã revoked".

### R-05 — `application-test.yml` nằm trong `main/resources`, sẽ lọt vào jar production (MAJOR)

File ở `backend/src/main/resources/application-test.yml`, không phải `src/test/resources/`. Nó
được đóng gói vào artifact chạy thật. Nội dung:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:portfolio;MODE=PostgreSQL
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

Bất kỳ ai chạy production với `SPRING_PROFILES_ACTIVE=test` (biến môi trường sai, giá trị mặc
định trong compose file ở plan 15, một dòng thừa trong CI ở plan 17) sẽ khởi động lên một H2
in-memory với `create-drop` và **không kết nối tới Postgres**. Ứng dụng lên xanh, đăng nhập
"thành công", dữ liệu bốc hơi khi restart. Không có gì cảnh báo.

Chuyển file sang `backend/src/test/resources/application-test.yml`. Sửa trước plan 15, không để
lâu hơn.

### R-06 — Test dọn token chỉ xanh vì schema test khác schema thật (MINOR, là ca cụ thể của F-01)

`RefreshTokenCleanupJobTest.save()` (`:34-41`) ghi `token.setUserId(1L)` trong khi bảng `users`
rỗng. Trên Postgres thật, `V1__init_schema.sql:15` có
`user_id BIGINT NOT NULL REFERENCES users(id)` — lệnh insert đó **vi phạm khoá ngoại và fail**.

Test xanh vì hai lý do cộng lại: `RefreshToken.userId` là `Long` trần chứ không phải `@ManyToOne`,
nên Hibernate không sinh FK nào; và Flyway bị tắt nên FK trong migration không bao giờ được áp.
DDL mà H2 thực sự tạo ra, lấy từ log chạy test:

```
create table refresh_tokens (revoked boolean not null, created_at timestamp(6) with time zone
not null, expires_at timestamp(6) with time zone not null, id bigint generated by default as
identity, user_id bigint not null, token_hash varchar(255) not null, primary key (id))
```

Không có `references users(id)`. Đây chính là F-01 hiện hình: **suite 16/16 không nói được gì về
việc entity có khớp migration hay không.**

### R-07 — Vẫn chưa có test cho nhánh "user bị deactivate thì không refresh được" (MINOR)

`rotate()` dòng 55 `.filter(User::isActive)` là **kiểm tra tài khoản phía server duy nhất trong
toàn bộ luồng JWT** — F-09 chấp nhận access token sống thêm tối đa 15 phút chính là vì tin vào
dòng này. Không có test nào phủ nó. Xoá `.filter(User::isActive)` đi thì suite vẫn 16/16 xanh, và
tài khoản bị vô hiệu hoá gia hạn được session vô thời hạn.

Đây là finding đã ghi trong STATUS.md từ hôm qua; vòng này xác nhận vẫn còn nguyên. Không nên để
sang tới plan 10.

### R-08 — Không có trần số refresh token sống trên mỗi user (MINOR)

`login` gọi `issue()` mỗi lần, không revoke token cũ. Mỗi lần đăng nhập thêm một row sống 7 ngày.
Chưa có rate limit (plan 09), nên một kẻ có credential hợp lệ bơm được bảng `refresh_tokens` tuỳ
ý; kết hợp R-02 và R-03 thì đây là đường dẫn tới việc làm chậm cả hệ thống. F-06 vì vậy mới đóng
được một nửa: job dọn tồn tại, nhưng nguồn sinh thì không bị chặn.

### R-09 — Test job không chứng minh job được đăng ký (MINOR)

`RefreshTokenCleanupJobTest:27` gọi `new RefreshTokenCleanupJob(refreshTokenRepository)` trực
tiếp. Nó test được logic delete, nhưng gỡ `@EnableScheduling` khỏi
`PortfolioPlatformApplication` hoặc gỡ `@Scheduled` khỏi `purgeExpiredTokens()` thì test **vẫn
xanh** và job không bao giờ chạy trên production.

Không đòi test cron thật. Nhưng một assert rằng bean scheduling tồn tại và cron expression parse
được thì rẻ, và nó khoá được đúng chỗ đang hở.

### R-10 — H2 sinh `timestamp with time zone`, migration khai `TIMESTAMP` (INFO, bằng chứng cho F-08)

Cũng từ DDL ở R-06: H2 tạo `timestamp(6) with time zone` cho mọi cột `Instant`, trong khi
`V1__init_schema.sql` khai `TIMESTAMP` (không timezone). Trên Postgres, `Instant` ghi vào
`TIMESTAMP WITHOUT TIME ZONE` là đường dẫn cổ điển tới lệch múi giờ.

Đây đúng là F-08 đã mở sẵn. Ghi lại ở đây vì giờ đã có bằng chứng cụ thể thay vì phỏng đoán:
schema test và schema thật khác nhau ở kiểu dữ liệu, không chỉ ở ràng buộc.

---

## Điều được làm tốt (ghi lại để không bị sửa ngược sau này)

- Rotation-on-use có thật và **có test kiểm chứng** (`refresh_withAlreadyRotatedToken_returns401`),
  không phải test rỗng.
- `logout` luôn trả 204 bất kể có khớp row hay không — chặn đúng token-validity oracle, và có
  comment giải thích *tại sao* chứ không phải mô tả code.
- Job cố ý **giữ** row revoked-nhưng-chưa-hết-hạn, có comment nêu lý do. Đây là chi tiết dễ bị một
  lượt "dọn dẹp" sau này xoá mất, và khi đó R-04 sẽ hỏng luôn phần đang đúng.
- Gỡ `jwt.refresh-secret` là đúng: refresh token là chuỗi ngẫu nhiên opaque, secret ký không có
  nghĩa gì.

---

## Kết luận

**VERDICT: NEEDS_REVISION.** Không có finding nào chặn ở mức "code sai chức năng" — luồng
login/refresh/logout chạy đúng như spec mô tả. Nhưng R-01 là lỗi mới do chính commit tự nhận là
sửa timestamp gây ra, và R-05 là một cái bẫy mất dữ liệu ở production chỉ cách một biến môi
trường.

Đề nghị gom thành **plan 03c** và làm xong trước khi mở plan 04:

| Ưu tiên | Finding | Lý do không hoãn được |
|---|---|---|
| 1 | R-05 | Bẫy mất dữ liệu, sửa mất 1 phút (di chuyển file) |
| 2 | R-01 | Càng để lâu càng nhiều dữ liệu `updated_at` rác |
| 3 | R-03 | Cần migration V2; thêm migration sớm rẻ hơn thêm muộn |
| 4 | R-02 | Cùng migration V2 (index `expires_at`) |
| 5 | R-04 | Vá lỗ hổng bảo mật thật, không chỉ hạn chế đã biết |
| 6 | R-07 | Khoá lại `.filter(User::isActive)` trước khi ai đó "dọn dẹp" nó |

Hoãn được sang sau plan 04: R-06, R-08, R-09, R-10 — R-06 và R-10 gắn với F-01, vốn đã chốt là
phải đóng trước plan 15 bằng Testcontainers.
