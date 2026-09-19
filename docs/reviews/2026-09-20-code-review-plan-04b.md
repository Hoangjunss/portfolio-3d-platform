# Code Review — Plan 04b (tái cấu trúc phân lớp)

**Ngày:** 2026-09-20
**Phạm vi:** `1d3087f` (task 1) + `382f0e6` (task 2–8) + `f21dfaf` (docs)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-20-04b-layered-architecture-restructure.md`
**Spec đối chiếu:** mục 5.1 của `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`
**Người viết code:** Antigravity — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| `mvn -f backend/pom.xml test` (JDK 21.0.11) | **26/26 PASS**, **3 lần chạy liên tiếp** đều xanh |
| Số test trước / sau | 25 → 26 (thêm `LayerDependencyTest`) |
| Task 1–8 | **Xong cả 8** (task 1 ở lượt trước, 2–8 ở lượt này) |
| Bốn vi phạm CRITICAL | **Hết sạch** — xác minh bằng grep, không tầng nào trong `controller`/`scheduler`/`aspect`/`exception` import `repository` |
| Hồi quy 404→500 | **Đã vá** |
| Moves ghi nhận là rename | **Đúng** — 18 file hiện dạng `{cũ => mới}` trong `--stat` |
| Commit body | Trung thực, khớp từng điểm với những gì tôi kiểm lại độc lập |

### Cấu trúc thật so với spec 5.1

Khớp. `annotation`, `aspect`, `config`, `controller`, `converter` (+`impl`), `dto`, `enums`,
`exception`, `facade` (+`impl`), `filter`, `form`, `model`, `repository`, `scheduler`, `service`
(+`impl`). Không còn file nào dưới `auth/`, `user/`, `audit/`, `error/`.

### Mutation check `LayerDependencyTest`

Đây là deliverable quan trọng nhất của plan, nên tôi kiểm riêng: thêm
`import com.portfolio.platform.repository.UserRepository;` vào `controller/AuthController.java`.

```
[ERROR] LayerDependencyTest.layerDependenciesMustFollowRules:78 Architecture layer violations:
[ERROR] Tests run: 1, Failures: 1, Errors: 0
```

Đỏ, và **nêu đúng tên file**. Test có trọng lượng thật.

### Vá 404 — kiểm nội dung assert, không chỉ tên test

```java
void unmappedPublicEndpoint_returns404() {
    long before = systemErrorLogRepository.count();
    ...
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(response.getBody()).contains("NOT_FOUND");
    assertThat(systemErrorLogRepository.count()).isEqualTo(before);   // <- vế quan trọng nhất
}
```

Có đủ cả vế thứ ba. Đây là vế chặn việc ai đó nới lại catch-all về sau — nếu thiếu, test vẫn xanh
khi bảng `system_error_logs` lại bị bơm.

---

## Phát hiện

### A-01 — `LayerDependencyTest` mới phủ 2 trong 8 luật (MAJOR)

Plan task 4 step 1 yêu cầu mã hoá **toàn bộ bảng phụ thuộc** của spec 5.1. Thực tế test chỉ assert
hai điều:

1. `controller`/`scheduler`/`aspect`/`exception` không import `repository`;
2. `controller` không import `converter`.

Đúng là hai luật giá trị nhất, và chúng bắt đúng bốn vi phạm đang có. Nhưng những luật mà skill
xếp **NEVER ALLOWED** sau đây hiện **không được phủ**:

| Luật bị bỏ sót | Hậu quả nếu tái phạm |
|---|---|
| Service → Facade | Vòng phụ thuộc, không ai phát hiện |
| Converter → Service | Converter chứa quyết định nghiệp vụ |
| Converter → Repository | Converter truy vấn DB, chính pattern skill gọi là "discouraged" |
| Helper → Service / Facade | Đảo tầng |

Đây không phải vấn đề của hôm nay — hiện chưa có `helper/` và converter đang sạch. Nó là vấn đề
của **plan 06–18**: mỗi plan sau đều thêm service và converter mới, và test này chính là thứ duy
nhất ngăn chúng đi sai. Phủ thiếu nghĩa là plan 06 có thể để `ContentSectionConverter` gọi thẳng
repository mà build vẫn xanh, và ta chỉ biết khi có ai đó đọc code bằng mắt.

Đề nghị: hoàn thiện bảng luật thành allow-list đầy đủ (mỗi tầng chỉ được import các tầng được
phép), làm **trước plan 05**, kèm mutation check cho ít nhất hai luật mới.

### A-02 — `AuthServiceFacadeImpl.login` vẫn giữ quyết định nghiệp vụ (MINOR)

```java
User user = userService.findActiveByUsername(form.username())
        .filter(u -> userService.verifyPassword(u, form.password()))
        .orElseThrow(InvalidCredentialsException::new);
```

Phép so khớp mật khẩu nằm trong `UserService` — đúng. Nhưng **quyết định** ("không khớp thì ném")
nằm trong Facade. Skill liệt kê "conditional domain logic" trong Facade là pattern vi phạm, và
Facade chỉ được điều phối rồi định tuyến kết quả.

Sửa gọn: `UserService.authenticate(String username, String password): Optional<User>` gói cả ba
bước (tìm, lọc active, so mật khẩu). Facade còn lại đúng một dòng
`.orElseThrow(InvalidCredentialsException::new)` — vẫn là định tuyến, không còn là luật.

Không chặn ship: hành vi đúng, hai thuộc tính bảo mật (không lộ enumeration, logout không làm
oracle) đều được giữ nguyên kèm comment.

### A-03 — Comment "token-validity oracle" bị nhân đôi (NIT)

Cùng một đoạn giải thích xuất hiện ở cả `controller/AuthController.logout` và
`facade/impl/AuthServiceFacadeImpl.logout`. Một chỗ là đủ; hai chỗ thì lần sửa sau dễ lệch nhau,
và comment lệch còn tệ hơn không có. Giữ ở Facade (nơi thật sự quyết định), bỏ ở Controller.

### A-04 — `LayerDependencyTest` mù với tham chiếu fully-qualified (INFO, plan đã tự ghi nhận)

Test đọc các dòng `import`, nên một vi phạm viết dạng
`com.portfolio.platform.repository.UserRepository x = ...` sẽ lọt.

Điều đáng nói: pattern đó **đã có thật trong codebase này** — chính `GlobalExceptionHandler` viết
`@ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)` dạng
fully-qualified. Không phải vi phạm (Spring, không phải package nội bộ), nhưng nó chứng minh cách
viết đó không hề giả định. ArchUnit sẽ bịt được lỗ này nếu dự án chịu thêm một dependency.

### A-05 — `RotationDto` mang entity `User`, tức `dto` phụ thuộc `model` (INFO)

Trong spec 5.1 cả hai đều là leaf. Đã ghi nhận ở commit `1d3087f` là "revisit rather than
enshrine". Sau khi có Facade thì `refresh()` đã tự lấy `rotation.user()` để mint token, nên type
này vẫn cần. Chấp nhận, nhưng nếu `RotationDto` chỉ cần `userId` + `username` + `role` thì bỏ được
phụ thuộc — cân nhắc khi chạm tới lần sau.

---

## Điều làm tốt

- **Bốn vi phạm CRITICAL biến mất thật**, không phải chuyển chỗ. `RefreshTokenCleanupJob` gọi
  `purgeExpired()`, `GlobalExceptionHandler` gọi `SystemErrorLogService.record()`, `AuditAspect`
  gọi `AuditLogService` + `UserService`.
- `AuthController` giờ là ba method thuần uỷ quyền, không `if`, không `ResponseEntity<?>`, trả về
  `ResponseEntity<TokenDto>` có kiểu. Đóng luôn R-04 của review plan 04.
- **Toàn bộ comment giải thích sống sót qua cuộc dời** — 18 file đổi chỗ mà không mất dòng nào.
  Đây là điều tôi lo nhất khi giao: chúng mã hoá phát hiện của bốn vòng review.
- `git mv` dùng đúng: `--stat` hiện dạng `{auth => controller}`, history theo file.
- Commit body khai báo đủ và **khớp từng điểm** với những gì tôi kiểm lại độc lập — kể cả thông
  điệp lỗi của mutation check.
- `findSourceRoot()` có fallback hai đường dẫn, nên test chạy được cả khi basedir là repo root hay
  `backend/`.

---

## Kết luận

**VERDICT: PASS — đủ điều kiện push.**

Tám task xong đủ, 26/26 ổn định qua ba lần chạy, bốn vi phạm CRITICAL đã hết, hồi quy 404 đã vá
kèm assert chặn tái phát, và deliverable then chốt (`LayerDependencyTest`) đã được mutation check.

Cả cụm commit từ `a95f958` tới `f21dfaf` giờ có thể push: lý do giữ `a95f958` ở local là hồi quy
404, nay đã được `382f0e6` vá.

Hai việc mang sang:

| Finding | Xử lý |
|---|---|
| A-01 | **Làm trước plan 05** — hoàn thiện `LayerDependencyTest` thành allow-list đủ 8 luật |
| A-02 | Gộp vào plan 05 hoặc lần sau chạm `UserService` |
| A-03, A-04, A-05 | Ghi nhận, không chặn |
