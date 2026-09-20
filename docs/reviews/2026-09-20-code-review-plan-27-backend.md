# Code review — plan 27 backend (settings list), lượt 1: **code đúng, nhưng commit làm đỏ suite**

**Ngày:** 2026-09-20
**Commit:** `be7fcf0` + bản vá luật kiến trúc của tôi
**Kết quả:** sau vá **182/182 PASS** (174 nền + 8 mới). Trước vá: **BUILD FAILURE**.

## F-01 (CHẶN) — `LayerDependencyTest` đỏ, và lệnh verify tôi giao không thể phát hiện

Chạy full suite trên commit `be7fcf0`:

    LayerDependencyTest.layerDependenciesMustFollowRules:103 Architecture layer violations:
    service/impl/SettingsServiceImpl.java imports com.portfolio.platform.constant.SettingKeys
    Tests run: 182, Failures: 1

**Lỗi này là của tôi nhiều hơn của lượt giao.** Lệnh verify tôi viết trong handoff là:

    mvn -B -f backend/pom.xml -Dtest=SettingsControllerListTest,SettingsServiceListAllTest test

`LayerDependencyTest` không nằm trong danh sách đó. Nếu lượt giao chạy **đúng** thứ tôi yêu cầu, nó
sẽ thấy xanh và báo xanh — trong khi `master` đỏ. Thu hẹp lệnh test để chạy nhanh đã che mất đúng
loại test có tính toàn cục.

## Nguyên nhân gốc — lỗi của plan, không phải của code

`LayerDependencyTest` khai `constant` là một layer:

```java
entry("constant", Set.of()),      // phụ thuộc vào không gì cả
```

Nhưng `constant` **không xuất hiện trong allowed-set của bất kỳ layer nào**. So với các layer lá
khác thì thấy ngay chỗ sót — `enums`, `util`, `annotation` đều vừa là key vừa nằm trong allowed-set
của layer khác. Riêng `constant` chỉ có key. Tức package đó được khai báo nhưng **không ai import
được**, và plan 27 là thứ đầu tiên thật sự tạo ra nó.

Plan 27 yêu cầu `Create: constant/SettingKeys.java` mà không nhắc gì tới việc phải mở luật.

**Đã vá:** thêm `"constant"` vào allowed-set của `service`, **chỉ ở đó**, kèm comment giải thích.
Không mở cho controller/facade vì hiện không ai cần — để test tiếp tục bắt buộc phải bàn bạc khi
layer khác muốn dùng. Đó chính là lý do test này tồn tại.

## Code — đúng, và chỗ hay nhất là cách chặn số dòng

```java
@Transactional(readOnly = true)
public List<SettingDto> listAll() {
    return settingRepository.findAllByKeyIn(SettingKeys.ALL).stream()
            .map(settingConverter::toDto)
            .toList();
}
```

Endpoint trả `List` không phân trang. Thoạt nhìn là vi phạm Global Constraint *"use pagination on
list endpoints"*, nhưng không phải: truy vấn bị giới hạn bằng `findAllByKeyIn(SettingKeys.ALL)`, tức
**chặn cứng ở 4 dòng** bất kể bảng chứa gì. Mạnh hơn phân trang, và còn một tác dụng phụ tốt: một
key rác hay key cũ còn sót trong DB cũng không lọt lên màn admin. Có test
`listAll_filtersOutUnrelatedKeys` khẳng định đúng điều đó.

`@Transactional(readOnly = true)`, không `@Audited`, `java.util.List` được import đủ ở cả ba file —
tránh được cái bẫy đã làm đỏ build ở plan 22.

## Test — 8 case, và có cái riêng của endpoint này

    listSettings_unauthenticated_returns401
    listSettings_asEditor_returns403Forbidden        <- chỉ endpoint này có
    listSettings_asAdmin_returnsAllExistingRows
    listSettings_returnsEmptyList_whenNoSettingsExist
    listSettings_isReadOnly_doesNotWriteAuditLog
    listAll_returnsOnlyExistingRows_noExceptionForMissingKeys
    listAll_returnsEmptyList_onFreshInstall
    listAll_filtersOutUnrelatedKeys

`asEditor_returns403` là điểm khác biệt thật: `SecurityConfig` chặn
`/api/admin/settings/**` ở mức `hasRole("ADMIN")`, nghiêm hơn luật `/api/admin/**` chung. Audit-log
và error-log cho EDITOR đọc; cái này thì không. Test phản ánh đúng sự khác biệt đó thay vì chép
nguyên khuôn hai plan trước.

## Bài học cho các handoff sau

Lệnh verify thu hẹp phải **luôn kèm `LayerDependencyTest`**:

    -Dtest=<TestMới>,LayerDependencyTest

Vì đây là test duy nhất trong dự án có thể đỏ vì một file mà nó không hề nhắc tên.

## Ship

Đã push kèm bản vá luật. Task frontend của plan 27 cần giao riêng.
