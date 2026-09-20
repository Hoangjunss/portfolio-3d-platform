# Code Review — Plan 11 Task 1 (`GET /api/admin/leads`)

**Ngày:** 2026-09-20
**Phạm vi:** commit `136a486`, sửa thêm ở `6a39589`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-11-frontend-scaffold.md`, Task 1
**Người viết code:** Antigravity (lượt 10) — review độc lập

## Độ bao phủ thật của lượt giao

Hai lượt trước đó tạo ra **0 file** (xem `7997924`). Lượt này Antigravity hoạt động lại.

| Hạng mục | Kết quả |
|---|---|
| Task 1, step 1–9 | **Xong cả chín**, kể cả commit và sửa plan 14 |
| Năm file mới đúng vị trí tầng | Đúng |
| Controller chỉ tiêm `LeadService`, không tiêm `LeadRepository` | Đúng |
| `LeadDto` đúng tám trường, không có `internalNote`/`assignedTo` | Đúng |
| `status` giữ kiểu `LeadStatus` | Đúng — JSON ra `"CLOSED"`, `"CONTACTED"`, `"NEW"` |
| `mvn clean test` | **125/125 PASS** (120 → 125, +5) |
| Step 5 của plan 14 | Đã thay bằng dòng trỏ sang endpoint mới |

### Mutation check — **commit body trống, tôi phải tự chạy cả ba**

Handoff yêu cầu rõ "báo cáo kết quả từng cái, kể cả cái xanh". Commit `136a486` có **body rỗng
hoàn toàn** — không mutation, không số test, không gì. Đây là bước lùi so với ba lượt gần nhất.

| # | Revert gì | Kết quả tôi đo |
|---|---|---|
| M1 | `Sort.Direction.DESC` → `ASC` | **ĐỎ** — `$.content[0].name expected:<Lead 3> but was:<Lead 1>` |
| M2 | thêm `internalNote` vào `LeadDto` + converter | **ĐỎ** — `Expected no value at "$.content[0].internalNote" but found: 'sensitive internal note'` |
| M3 | controller trả `List` thay vì `Page` | **ĐỎ** — `No value at JSON path "$.content"`, 2 test đỏ |

Ghi chú về M2: lần chạy đầu chỉ ra **lỗi biên dịch** (`LeadServiceTest` gọi constructor 8 tham
số), chưa tới được assertion. Phải sửa luôn lời gọi trong test rồi chạy lại thì mới là phép đo
thật. Một mutation không biên dịch được **không phải** là mutation đỏ.

---

## Phát hiện

### F-11 — `@PageableDefault` không phải là trần, và plan của tôi nói sai điều đó (MINOR — **đã sửa ở `6a39589`**)

Plan 10 và plan 11 đều viết rằng `@PageableDefault(size = 20)` khiến client "không thể xin hết
bằng `?size=100000`". **Sai.** `@PageableDefault` chỉ đặt giá trị *mặc định* khi client không
truyền `size`. Trần nằm ở `spring.data.web.pageable.max-page-size`, mặc định **2000**, và dự án
chưa từng đặt nó.

Probe chạy thật trên `136a486`:

```
GET /api/admin/leads?size=100000  ->  "size":2000
GET /api/admin/users?size=100000  ->  "size":2000
```

Không phải lỗi của lượt giao — nó làm đúng y như plan viết. Lỗi nằm ở plan, và nó đã lặp qua hai
plan vì lần đầu không ai đo.

Vì sao đáng sửa: `leads` là bảng duy nhất mọc theo lưu lượng khách, mỗi dòng chứa `message` tới
5000 ký tự. 2000 dòng một request là vài MB JSON dựng trong bộ nhớ, trên heap `-Xmx350m` — đúng
thứ ràng buộc RAM trong Global Constraints nói tới. Đặt `max-page-size: 100`, kèm test assert
`?size=100000` trả `"size":100`.

### F-12 — Commit body trống (MINOR, lỗi quy trình)

Ba lượt gần nhất đều khai mutation đầy đủ, có lượt còn tự khai cái xanh. Lượt này không khai gì.
Không có cách nào phân biệt "đã chạy và đều đỏ" với "không chạy" ngoài việc tôi tự chạy lại —
và đó đúng là lý do quy trình này bắt tự chạy.

### F-13 — Một cái bẫy YAML tôi tự vấp khi sửa F-11 (INFO, đáng ghi)

Lần sửa đầu tôi thêm một khối `data:` thứ hai dưới `spring:` trong khi `spring.data.redis` đã tồn
tại. YAML khoá trùng: khối sau ghi đè khối trước, cấu hình Redis biến mất, và suite ra **74
error**. Không có lỗi cú pháp nào — chỉ âm thầm mất cấu hình.

Đáng ghi vì `application.yml` giờ đã có sáu nhánh con dưới `spring:`, và plan 15/16 sẽ còn thêm.
Mỗi lần thêm khoá phải kiểm nhánh cha đã tồn tại chưa, chứ không chèn một khối mới cho tiện.

### F-14 — `list_asEditor_returns200` xác nhận đúng điều plan đoán (ghi nhận)

Plan viết: "nếu ra 403 thì báo cáo lại, đừng sửa `SecurityConfig`". Test xanh với role EDITOR,
nghĩa là quy tắc `/api/admin/**` cho phép cả ADMIN lẫn EDITOR đúng như đọc hiểu ban đầu, và
`SecurityConfig` không bị đụng tới. Đây là cách một giả định trong plan được xác nhận bằng test
thay vì bằng niềm tin.

---

## Điều làm tốt

- **Kiến trúc đúng ngay lần đầu.** Controller chỉ biết `LeadService`; không có `LeadRepository`
  nào lọt vào, dù `LayerDependencyTest` mù với tham chiếu tên đầy đủ và sẽ không bắt được nếu có.
  Viết đúng tầng chứ không viết vừa đủ để test xanh.
- **Test sắp xếp có sức nặng thật**: ba lead với `createdAt` phân biệt rõ, assert cả thứ tự lẫn
  `totalElements`, `totalPages`, `size`, `number`. M1 và M3 đỏ được là nhờ bộ assertion này.
- **`list_neverExposesInternalNote` kiểm cả `assignedTo`**, không chỉ trường plan nêu tên.
- Comment trên `LeadDto` ghi đúng hai điều một người đọc sau cần biết: dữ liệu là do người lạ
  nhập, và hai trường kia bị bỏ ra có chủ ý.

---

## Kết luận

**VERDICT: PASS — `136a486` + `6a39589`.**

126/126. Endpoint cuối cùng mà nhóm plan frontend phụ thuộc giờ đã tồn tại và làm đúng spec 5.1,
thay cho đoạn vi phạm tầng mà plan 14 từng mang. Ba mutation tôi tự chạy đều đỏ.

| Finding | Xử lý |
|---|---|
| **F-11** | **Đã sửa** (`6a39589`) — `max-page-size: 100`, có test |
| F-12 | Ghi nhận — lượt sau phải khai mutation trong commit body |
| F-13 | Ghi nhận — thêm khoá vào `application.yml` phải kiểm nhánh cha đã có chưa |
| F-14 | Xác nhận: EDITOR đọc được leads, `SecurityConfig` không cần đổi |

**Còn lại của plan 11:** Task 2 (dựng Next.js, 9 step) chưa bắt đầu.
