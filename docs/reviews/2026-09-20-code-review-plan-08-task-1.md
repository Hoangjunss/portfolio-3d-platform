# Code Review — Plan 08 Task 1 (chặn lỗ bơm `system_error_logs`)

**Ngày:** 2026-09-20
**Phạm vi:** commit `d04bf9d`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-08-analytics.md`, Task 1
**Người viết code:** Antigravity (lượt 4) — review độc lập

## Độ bao phủ thật của lượt giao

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–4 (test, handler, lưới an toàn, chạy suite) | **Xong** |
| Task 1, step 5 (3 mutation check) | **Không có dấu vết chạy.** Tôi tự chạy, và chạy thêm 2 cái nữa |
| Task 1, step 6 (commit) | **Bỏ.** Code nằm ở working tree — tôi commit |
| Task 2 (8 step) | **0/8.** Không một file `*Analytics*` nào, không có `V3__` |

**6/14 step.** Lần thứ ba liên tiếp bỏ đúng bước commit (03c, 07 lần 2, và lần này).

| Kiểm chứng | Kết quả |
|---|---|
| `mvn -f backend/pom.xml clean test` (JDK 21.0.11) | **79/79 PASS** |
| Số test trước / sau | 73 → 79 (+6) |
| Lỗ hổng gốc | Đã đóng — `malformedJsonOnPublicEndpoint_returns400AndWritesNoErrorLog` chạy thẳng vào `/api/public/leads` thật, không phải endpoint giả |

### Mutation check — tôi tự chạy, và mở rộng so với plan

Plan chỉ yêu cầu 3. Tôi chạy 4, vì M1 ra một kết quả khiến câu hỏi "lưới an toàn thật sự phủ
được gì" trở nên đáng đo.

| # | Revert gì | Kết quả đo được |
|---|---|---|
| M1 | xoá handler `HttpMessageNotReadableException`, **giữ lưới** | **ĐỎ — `expected:<400> but was:<500>`** |
| M2a | xoá handler `HttpRequestMethodNotSupportedException`, **giữ lưới** | ĐỎ, nhưng **chỉ sai chuỗi `code`**: `expected:<METHOD_NOT_ALLOWED> but was:<BAD_REQUEST>`. **Status vẫn là 405** |
| M2b | xoá handler `MethodArgumentTypeMismatchException`, **giữ lưới** | **ĐỎ — `expected:<400> but was:<500>`** |
| M3 | đổi message của handler malformed-body sang `ex.getMessage()` | ĐỎ, và lộ nguyên văn chỗ rò |

---

## Phát hiện

### P-01 — Lưới an toàn có lỗ **đúng ngay chỗ lỗ hổng ban đầu nằm** (MAJOR để hiểu, không phải lỗi code — **đã ghi comment ở `d04bf9d`**)

Quyết định (a) của plan viết lưới `ErrorResponse` để "lần thứ tư không lặp lại". Nhưng plan giả
định rằng các exception client-fault của Spring MVC đều implement `ErrorResponse`. Ba mutation
trên cho thấy giả định đó **đúng một nửa**:

| Exception | Lưới có đỡ không? |
|---|---|
| `HttpRequestMethodNotSupportedException` | **Có.** Bỏ handler riêng, status vẫn 405, không ghi log row |
| `HttpMessageNotReadableException` | **KHÔNG.** Bỏ handler riêng → 500 |
| `MethodArgumentTypeMismatchException` | **KHÔNG.** Bỏ handler riêng → 500 |

Tức là lưới đỡ được những loại **chưa từng gây chuyện**, và không đỡ được đúng hai loại **đã gây
chuyện**. Nếu chỉ đọc code mà không đo, rất dễ kết luận ngược.

Hệ quả vận hành: hai handler `HttpMessageNotReadableException` và
`MethodArgumentTypeMismatchException` là **load-bearing**. Một lần refactor "dọn cho gọn" xoá
chúng đi vì tin rằng lưới đỡ sẽ khôi phục nguyên vẹn lỗ hổng, và suite vẫn xanh nếu ai đó cũng
xoá test. Đã thêm comment ngay trên chúng nói rõ điều này kèm lý do đo được.

Lưới vẫn đáng giữ — nó thật sự giữ đúng status cho nhóm còn lại — nhưng đừng coi nó là bảo hiểm
toàn phần.

### P-02 — Ba handler echo `ex.getMessage()` ra client (MINOR — **đã sửa trong `d04bf9d`**)

M3 cho thấy cụ thể chỗ rò khi echo message của Jackson:

```
JSON parse error: Cannot deserialize value of type `java.lang.Long` from String "not-a-number"
```

Handler malformed-body đã dùng chuỗi cố định đúng như plan dặn. Nhưng ba handler còn lại thì
không: 405 và 415 echo `ex.getMessage()`, và `MissingServletRequestPartException` echo ra
nguyên `"Required request parameter 'file' for method parameter type MultipartFile is not present"`
— lộ tên kiểu tham số Java.

Cùng loại với T-03 và D-04. Đã đổi cả ba sang chuỗi cố định.

### P-03 — Response 405 không có header `Allow` (MINOR)

RFC 9110 nói 405 **SHOULD** kèm `Allow` liệt kê method được phép.
`HttpRequestMethodNotSupportedException.getSupportedMethods()` có sẵn giá trị đó. Hiện không trả.

Không phải lỗ hổng, nhưng là thứ client tự động (và một số thư viện HTTP) đọc để biết phải làm
gì. Để plan 09 xử lý cùng lúc nó chạm tới tầng HTTP — cần thêm một assertion trên header, không
chỉ status.

### P-04 — Import thừa trong test (INFO)

`GlobalExceptionHandlerTest` import `PathVariable` và `RequestBody` rồi lại dùng tên đầy đủ
`@org.springframework.web.bind.annotation.RequestBody` ngay tại chỗ. Vô hại, nhưng là dấu vết
của việc sinh code rồi không dọn.

---

## Điều làm tốt

- **Test cuối cùng đánh vào endpoint thật.** `malformedJsonOnPublicEndpoint` gọi
  `/api/public/leads` chứ không phải `BoomController`. Đây là khác biệt giữa "handler có chạy"
  và "lỗ hổng đã đóng" — và nó chọn đúng cái thứ hai. Test này cũng là cái duy nhất trong nhóm
  không có `@WithMockUser`, đúng với thực tế của lỗ hổng: không cần đăng nhập.
- **Phủ đủ năm loại plan liệt kê**, mỗi loại đều assert cả status, `code`, lẫn số dòng
  `system_error_logs` không đổi.
- Lưới an toàn đặt **trước** khi ghi log trong `handleUnexpected`, không phải sau.
- Không đụng tới bất kỳ handler cũ nào.

---

## Kết luận

**VERDICT: Task 1 PASS — `d04bf9d`.**

Lỗ hổng đóng thật, có test chạy vào endpoint thật chứng minh, và M1 đỏ chứng minh test có sức
nặng. Hai finding đã sửa ngay; P-03 và P-04 không chặn.

Điều đáng mang đi tiếp không phải là code, mà là **P-01**: một lưới an toàn được viết ra để
chống lặp lại, khi đo thì không phủ đúng hai loại đã từng gây ra sự cố. Viết lưới xong vẫn phải
đo từng loại.

**Plan 08 chưa xong:** Task 2 (analytics + đóng T-02) chưa bắt đầu, 0/8 step.

| Finding | Xử lý |
|---|---|
| P-01 | **Đã ghi comment** trong `d04bf9d`; hai handler đó là load-bearing |
| P-02 | **Đã sửa** trong `d04bf9d` |
| P-03 | Plan 09 — thêm `Allow` vào 405, kèm assertion trên header |
| P-04 | Dọn khi chạm lại file đó |
