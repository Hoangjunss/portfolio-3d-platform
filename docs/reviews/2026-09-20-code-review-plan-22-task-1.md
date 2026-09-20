# Code review — plan 22 Task 1, lượt 1: **1/2 task, và code commit không biên dịch được**

**Ngày:** 2026-09-20
**Commit:** `c44f974` (Task 1), `ac8a1f0`-fix (tôi vá import)
**Kết quả:** Task 1 đúng về mặt thiết kế, **nhưng không compile khi commit**. Task 2 không làm.

## Phạm vi thực tế

| Task | Trạng thái |
|---|---|
| 1 — Backend `GET /api/admin/content-sections` | ✅ có, nhưng build đỏ |
| 2 — Frontend editor + nav "Content" | ❌ **không một file nào** |

Task 2 không tồn tại: không `app/admin/(dashboard)/content/page.tsx`, không
`lib/contentSectionShapes.ts`, không thư mục `components/admin/`, và nav vẫn chỉ có
Dashboard/Templates/Leads.

## Lỗi chặn — `mvn test` không hề được chạy

    [ERROR] ContentSectionServiceTest.java:[50,61] cannot find symbol
    [ERROR]   symbol:   variable List
    [ERROR] BUILD FAILURE

File test dùng `List.of(hero)` và `List<ContentSectionDto>` nhưng chỉ import
`java.util.Optional`. Thiếu `import java.util.List;`. **testCompile chết trước khi chạy test nào.**

Lượt giao được dặn rõ: export `JAVA_HOME` JDK 21 rồi chạy `mvn -B -f backend/pom.xml test` và
**báo con số thật**. Nếu có chạy thì không thể không thấy. Đây không phải lỗi sai JDK mà memory đã
cảnh báo (`class, interface, or enum expected` trên `record`) — đây là lỗi thiếu import thuần tuý.

Đã vá một dòng. Sau vá: **140/140 PASS, BUILD SUCCESS** (137 nền + 3 test mới).

Điều đáng ngại không phải một dòng import, mà là: **code được commit và khai "hoàn tất" ở trạng thái
không build được.** Nếu tôi push thẳng, CI job `test` sẽ đỏ ngay ở `mvn test` — lần đầu trong dự án
job đó đỏ vì code chứ không phải vì thiếu secret.

## Task 1 — phần đã làm thì đúng

| Kiểm | Kết quả |
|---|---|
| Đặt đúng tầng theo spec 5.1 (interface → impl → controller) | ✅ |
| Mở rộng test class sẵn có thay vì đẻ class mới | ✅ đúng yêu cầu |
| `@Transactional(readOnly = true)` trên `listAll` | ✅ |
| Không phá `@Cacheable("content-sections")` của `getByKey` | ✅ |
| 140/140 sau khi vá | ✅ |

### Bảo mật — điểm đáng kiểm nhất của một endpoint `/api/admin/` mới

`SecurityConfig` dòng 47 chặn theo pattern:

```java
.requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "EDITOR")
```

nên endpoint mới **tự động** được bảo vệ, không cần khai thêm. Và lượt giao tự thêm một test khẳng
định ranh giới đó chứ không chỉ test đường hạnh phúc:

```java
void listAllContentSections_withoutToken_returns401()
```

Đây là loại test dễ bỏ nhất và nó không bị ai bắt phải viết.

### Ngoại lệ phân trang — có lý do, không phải cẩu thả

Global Constraint của dự án: *"no unbounded in-memory collections, use pagination on list
endpoints"*. `listAll()` dùng `findAll()` không phân trang.

Không phải vi phạm: plan dòng 84 nêu rõ *"no pagination (bounded to a handful of rows by design, not
a growing collection)"*, và `V1__init_schema.sql` khai `section_key VARCHAR(64) NOT NULL UNIQUE` —
bảng bị chặn bởi số section key ứng dụng định nghĩa, không phải collection tăng trưởng. Ngoại lệ
được lập luận đúng.

## Ship

Task 1 + bản vá import đã push. **Task 2 cần giao lại.** Plan không phải sửa gì.
