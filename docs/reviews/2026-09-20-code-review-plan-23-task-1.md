# Code review — plan 23 Task 1 (media list + delete), lượt 1: **PASS**

**Ngày:** 2026-09-20
**Commit:** `8a9ade8`
**Kết quả:** **150/150 PASS, BUILD SUCCESS** (140 nền + 10 test mới). Đúng phạm vi, test mạnh hơn
mức được yêu cầu. Một finding nhỏ, và nó là lỗi của plan.

## Ba lượt giao trước đó đều ra không — lần này khác vì handoff được sửa

| Lượt | Dấu vết | Kiểu hỏng |
|---|---|---|
| 1, 2 | không report mới, không file | kiểu 1 — chưa từng chạy |
| 3 | **1/35** report mới, `architecture.LayerDependencyTest` (package đầu alphabet), không file | kiểu 2 — chạy `mvn` trước rồi chết |
| 4 | commit thật, 5 file, compile được | ✅ |

Lượt 3 chết vì handoff của **tôi** đòi `mvn -B test` kèm "at least 140" — đúng thứ memory đã cấm,
vì nó mời đi đo baseline trước khi có code. Lượt 4 bỏ hẳn lệnh chạy trước khi viết file và thu lệnh
test về hai class. Sau đó nó **bỏ bước verify** (không report mới sau commit), đúng như memory dự
đoán — nên tôi tự chạy.

## Phạm vi

    MediaController.java       | 20 +++
    MediaService.java          |  6 ++
    MediaServiceImpl.java      | 33 ++++
    MediaControllerTest.java   | 87 ++++++++++
    MediaServiceTest.java      | 66 +++++++

`frontend/` không đụng — đúng yêu cầu tách lượt.

## Ba ràng buộc dễ trượt — cả ba đúng

### Trần page size

`@PageableDefault(size = 20)` **chỉ** đặt mặc định, không chặn trần — một cái bẫy thật. Nhưng dự án
đã chặn ở tầng cấu hình, và `application.yml` còn ghi sẵn lý do:

```yaml
# @PageableDefault only sets the default size, not a ceiling. Spring's own ceiling is
# 2000, so ?size=100000 still returned 2000 rows — ... against a 350MB heap.
max-page-size: 100
```

Endpoint mới thừa hưởng tự động, khớp tiền lệ `AdminLeadController`. Và lượt giao **tự viết test
chứng minh điều đó**:

```java
mockMvc.perform(get("/api/admin/media?size=100000"))
       .andExpect(jsonPath("$.size").value(100));
```

Không ai bắt nó viết test này.

### `audit_logs` trên DELETE

`@Audited(entityType = "Media", action = "DELETE")` — dùng đúng AOP sẵn có. Test
`deleteMedia_returns204AndWritesAuditLogRow` tạo file thật trong `tempDir`, khẳng định file tồn
tại, đếm `auditLogRepository.count()` trước/sau. Kiểm cả hai tác dụng phụ chứ không chỉ status code.

### Xoá file trên đĩa

```java
// Best-effort: a file already missing on disk must not turn a valid DB delete into a 500.
private void deleteFileQuietly(String url)
```

Tôi có nghi `Path.of(url)` ném `InvalidPathException` (**không** phải `IOException`, nên `catch`
không bắt) nếu `url` là URL đầy đủ có dấu `:`. Kiểm lại: `upload` đặt
`media.setUrl("/media/" + storedFileName)` — đường dẫn tương đối, không có scheme. Nghi ngờ không
thành hiện thực.

## Finding — tham số chết xuyên hai tầng

`delete(Long id, String username)` **không dùng `username`**. Aspect lấy danh tính từ
`SecurityContextHolder`:

```java
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
userId = userService.findIdByUsername(auth.getName()).orElse(null);
```

Controller vẫn tính rồi truyền vào vô ích:

```java
String username = (auth != null) ? auth.getName() : null;
mediaService.delete(id, username);
```

**Lỗi của plan, không phải của lượt giao** — plan dòng 72 chỉ định đúng chữ ký đó. Plan chép từ
`ContentSectionServiceImpl.upsert(key, form, username)`, nơi `username` có việc thật: điền cột
`updatedBy` của entity. `delete` xoá hẳn row nên không có cột nào để điền, còn vết kiểm toán thì
`@Audited` đã lo.

Hại thật sự là gây hiểu nhầm: người đọc sau sẽ tưởng `audit_logs` lấy tên từ tham số này, và có thể
"sửa lỗi" bằng cách đổi giá trị truyền vào — không có tác dụng gì.

Không sửa ngay: đổi chữ ký là 3 file + test, mà mỗi lượt giao hiện đang rất đắt. Gộp vào lượt dọn
admin cùng với quan sát 401 của plan 22.

## Ship

Đã push. Task 2 (frontend media grid) cần giao riêng.
