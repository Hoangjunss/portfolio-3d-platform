# Code Review — Plan 03c (auth review fixes round 2)

**Ngày:** 2026-09-20
**Phạm vi:** working tree chưa commit, trên nền `3ef147c`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-20-03c-auth-review-fixes-round2.md`
**Review được khắc phục:** `docs/reviews/2026-09-20-code-review-03b-self-implemented.md`
**Người viết code:** Antigravity (bàn giao 2026-09-20) — **đây là review độc lập đầu tiên của dự
án**: người viết code và người review lần này không còn là một.

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **20/20 PASS**, BUILD SUCCESS |
| Số test trước / sau | 16 → 20, đúng con số plan dự báo |
| Task 1 — chuyển `application-test.yml` | **Đã làm**, dùng `git mv` nên history theo file |
| Task 2 — `touchLastLoginAt` | **Đã làm** |
| Task 3 — `V2__refresh_token_indexes.sql` | **File có, CHƯA KIỂM CHỨNG** — xem V-01 |
| Task 4 — bulk delete | **Đã làm** |
| Task 5 — reuse detection | **Đã làm** |
| Task 6 — test deactivated user | **Đã làm** |
| Task 7 step 2 — mutation check | **Antigravity không làm.** Claude chạy thay, kết quả bên dưới |
| Task 7 step 3 — commit | **Chưa làm**, working tree để nguyên |

### Mutation check — 4/4 đỏ đúng chỗ

Đây là bước quan trọng nhất, vì dự án đã hai lần dính test rỗng (R-03 vòng 1, step 2 của plan 04
bản gốc). Mỗi lần: revert đúng một thay đổi production, chạy riêng test tương ứng, rồi khôi phục.

| Test | Thay đổi bị revert | Kết quả |
|---|---|---|
| `login_doesNotChangeUpdatedAt` | `touchLastLoginAt(...)` → `setLastLoginAt` + `save` | **FAILURE (1)** |
| `purgeExpiredTokens_usesBulkDelete` | `@Query` bulk delete → derived `deleteByExpiresAtBefore` | **FAILURE (1)** |
| `refresh_withReplayedToken_killsTheWholeFamily` | bỏ lời gọi `revokeAllForUser(...)`, giữ nguyên 401 | **FAILURE (1)** |
| `refresh_afterUserDeactivated_returns401` | bỏ `.filter(User::isActive)` | **FAILURE (1)** |

Mutation thứ ba cố ý chỉ gỡ **lời gọi** `revokeAllForUser` chứ không gỡ cả nhánh `isRevoked()` —
nếu gỡ cả nhánh thì `refresh_withAlreadyRotatedToken_returns401` cũng đỏ theo và không chứng minh
được test mới đang đo đúng thứ nó nói. Nó đỏ một mình, tức là nó thật sự đo family revocation.

Sau khi khôi phục, `git diff --stat` khớp đúng bản Antigravity bàn giao: 5 file, 43 thêm, 9 xoá.

---

## Đối chiếu từng finding

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| R-01 | **ĐÓNG** | `AuthController` dùng `userRepository.touchLastLoginAt(...)`; JPQL bulk update không bắn `@PreUpdate`. Test assert `updatedAt` **bằng** giá trị cũ và `lastLoginAt` sau mốc trước login — hai vế, không phải một |
| R-02 | **ĐÓNG** | `@Query("delete from RefreshToken t where t.expiresAt < :cutoff")`. Test assert `Statistics.getEntityDeleteCount() == 0` **và** cả ba row biến mất — vế thứ hai chặn đúng trường hợp job không xoá gì |
| R-03 | **CHƯA ĐÓNG** | File `V2__` đúng nội dung nhưng chưa từng chạy — xem V-01 |
| R-04 | **ĐÓNG** | `rotate()` tách `findByTokenHash` khỏi `findByTokenHashAndRevokedFalse`, nhánh `isRevoked()` gọi `revokeAllForUser`. Comment giải thích *tại sao*, không mô tả code |
| R-05 | **ĐÓNG** | `git mv` sang `src/test/resources`; suite vẫn resolve profile `test` bình thường |
| R-07 | **ĐÓNG** | `refresh_afterUserDeactivated_returns401`, mutation check xác nhận có trọng lượng |

---

## Phát hiện

### V-01 — `V2__refresh_token_indexes.sql` chưa từng được áp lên Postgres (CHẶN task 3, không phải lỗi code)

Plan task 3 step 2 yêu cầu kiểm chứng bằng Postgres thật qua Docker, và ghi rõ: nếu không có
Docker thì **DỪNG và báo**, không đánh dấu done. Kiểm tra trên máy:

```
$ docker info
/usr/bin/bash: line 1: docker: command not found
```

Không có Docker. Suite chạy H2 với Flyway **tắt**, nên 20/20 xanh không nói gì về file này. Cụ
thể chưa biết:

- `CREATE UNIQUE INDEX` trên `token_hash` có chạy được trên bảng đang có dữ liệu trùng hay không.
- Cú pháp `V2__` có được Flyway nhận đúng thứ tự sau `V1__` hay không.
- `idx_refresh_tokens_expires_at` có thật sự được planner dùng cho `deleteExpiredBefore` hay không.

Nội dung file thì đúng như plan mô tả. Vấn đề thuần tuý là **chưa chạy lần nào**. Đây là F-01
lặp lại đúng như dự đoán, và nó sẽ còn lặp cho tới khi có Testcontainers.

Không chặn việc commit — code Java không phụ thuộc vào index. Nhưng **R-03 phải ở lại bảng
finding mở**, không được tick.

### V-02 — Đăng xuất rồi refresh sẽ giết session của mọi thiết bị khác (MINOR, hệ quả mới của R-04)

`logout` set `revoked = true` nhưng **giữ row lại** (cố ý, để phát hiện replay). Sau đó bất kỳ
lượt `POST /api/auth/refresh` nào với chính token đó đều rơi vào nhánh `stored.isRevoked()` →
`revokeAllForUser(userId)`.

Với token bị đánh cắp thì đây đúng là hành vi mong muốn. Nhưng "revoked" hiện gộp hai nguyên nhân
rất khác nhau:

| Nguyên nhân revoked | Ý nghĩa khi bị trình lại | Xử lý hiện tại |
|---|---|---|
| bị rotate (đã dùng) | dấu hiệu token rò rỉ | giết cả họ — **đúng** |
| bị logout (user chủ động) | client còn request cũ trong hàng đợi | giết cả họ — **sai** |

Kịch bản thật: user bấm logout trên điện thoại, app còn một lượt refresh đang retry trong hàng
đợi; lượt đó bắn đi và đá luôn session trên máy tính. Không có gì báo cho user biết tại sao.

Plan có lường trước cái giá chung này ("a user who replays their own token gets signed out of
every device") nhưng nói về retry mạng chập chờn — trường hợp hiếm. Đường đi qua logout thì
**thường**, không hiếm.

Cách sửa gọn nhất: thêm cột `revoked_reason` (`ROTATED` / `LOGOUT`) và chỉ kích hoạt family
revocation khi lý do là `ROTATED`. Cần migration nên gộp vào cùng đợt với R-03 thì hợp lý.

Chưa chặn ship: hậu quả là phiền, không phải mất an toàn — nó thừa chứ không thiếu.

### V-03 — `UserRepository.java` thừa một dòng trống ở cuối file (NIT)

Không ảnh hưởng gì. Ghi lại để lần chạm file sau dọn luôn.

---

## Điều làm tốt

- Bốn test mới **đều có trọng lượng thật**, đã chứng minh bằng mutation check chứ không phải bằng
  lời. Đây là lần đầu trong dự án việc đó được làm cho toàn bộ test mới của một plan.
- `purgeExpiredTokens_usesBulkDelete` assert cả hai vế (`entityDeleteCount == 0` **và** row đã
  biến mất). Vế đầu một mình sẽ xanh cả khi job không xoá gì — đúng cái bẫy plan cảnh báo.
- `login_doesNotChangeUpdatedAt` có `entityManager.clear()` trước khi đọc lại, nên không assert
  trên entity cũ trong first-level cache.
- Mutation 3 tách được `refresh_withReplayedToken_killsTheWholeFamily` khỏi
  `refresh_withAlreadyRotatedToken_returns401` — hai test không chồng lên nhau.
- `git mv` thay vì xoá + tạo, nên `application-test.yml` giữ được history.

---

## Kết luận

**VERDICT: PASS.** Sáu task code làm đúng plan, suite 20/20, và bốn test mới đã được chứng minh là
không rỗng. Đủ điều kiện commit.

Hai việc **không** được coi là xong cùng commit này:

1. **R-03 vẫn mở.** `V2__` chưa chạy lần nào (V-01). Giữ nguyên trong bảng finding mở của
   `STATUS.md` cho tới khi có Postgres thật hoặc Testcontainers.
2. **V-02 là finding mới**, cần được ghi vào STATUS để xử lý cùng đợt migration tới.

Sau commit, bước kế tiếp là **plan 04** — file đã sửa xong ngày 2026-09-20 và sẵn sàng implement.
