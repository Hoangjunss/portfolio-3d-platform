# Code Review — Plan 10 (user management + R-14, R-08)

**Ngày:** 2026-09-20
**Phạm vi:** commit `4339067` (task 1), `4a40bd1` (task 2), sửa thêm ở `c10adee`
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-10-user-management.md`
**Người viết code:** Antigravity (lượt 7) — review độc lập

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 1 (7 step) + Task 2 (8 step) | **Xong cả 15**, hai commit riêng |
| Mười quyết định (a)–(j) | Làm đủ |
| Không đụng `SecurityConfig` (M11 có sửa tạm rồi khôi phục) | Đúng |
| Không nới allow-list `LayerDependencyTest` | Đúng |
| `mvn clean test` sau khi tôi bổ sung | **120/120 PASS** |
| Số test | 103 → 118 (lượt giao) → 120 (sau review) |

**Khai đủ 11 mutation, kể cả cái xanh.** R-13 của lượt trước không tái phát.

---

## Phát hiện

### U-01 — Dòng audit của việc tạo user không có `entity_id` (MAJOR — **đã sửa ở `c10adee`**)

`UserManagementService.create` trả `UserDto`. `AuditAspect` lấy id từ giá trị trả về bằng
`(result instanceof Long id) ? id : null` — nên với `UserDto` nó luôn ra **null**.

Không suy đoán, probe chạy thật rồi xoá:

```
PROBE_AUDIT_ROW_PRESENT=true
PROBE_AUDIT_ENTITY_ID=null
```

Spec mục 6 yêu cầu mọi thao tác admin CREATE/UPDATE/DELETE ghi một dòng `audit_logs`. Dòng có
ghi, nhưng **không biết nó nói về user nào** — một audit log không truy vết được thì gần như
không phải audit log. Và đây chính là điều quyết định (h) của plan cảnh báo, chỉ khác là plan chỉ
viết nó cho `deactivate` mà quên `create`. `deactivate` trả `Long` đúng; `create` thì không.

Đáng chú ý là ba module trước đều làm đúng vì đúng lý do này: `TemplateServiceImpl.create`,
`MediaServiceImpl.store`, `LeadServiceImpl.submit` đều trả `Long`, và `MediaController` gọi
`store` rồi `getById` để lấy DTO. Lượt này đi chệch khuôn mẫu đó mà không ai thấy, vì **không có
test nào assert `entity_id`** — các test chỉ đếm số dòng audit.

Sửa: `create` trả `Long`, thêm `getById`, controller gọi `create` rồi `getById` — đúng khuôn mẫu
`MediaController`. Thêm test assert `entity_id` bằng đúng id vừa tạo. Mutation ép
`entityId = null` trong `AuditAspect` làm test đó đỏ.

### R-14 — Đóng được, nhưng **không** bằng cách plan đề xuất (**đã đóng ở `c10adee`**)

Lượt giao khai thẳng: M1 (`AFTER_COMMIT` → `BEFORE_COMMIT`) **vẫn XANH**, và nêu đúng lý do —
`LeadNotificationListener` bắt `catch (Exception)` nên `RuntimeException` từ mock không bao giờ
thoát ra, do đó `BEFORE_COMMIT` cũng chẳng rollback. Rồi nó ghi thẳng "finding R-14 remains OPEN"
vào commit body thay vì lờ đi.

**Cách tôi thiết kế trong plan là sai, không phải code sai.** Cái `catch (Exception)` ấy là hành
vi production đúng: một lead đã lưu thành công không nên biến thành 500 chỉ vì SMTP hỏng. Bỏ nó
đi để test chạy được là đánh đổi ngược.

Cách phân biệt được, không cần đụng production code: trong stub của `notifyNewLead`, mở một
transaction `REQUIRES_NEW` và đếm `leads`.

- `AFTER_COMMIT` → transaction ngoài đã commit → transaction mới đếm được **1**
- `BEFORE_COMMIT` → chưa commit → đếm được **0**

Đo thật:

| Trạng thái code | Kết quả |
|---|---|
| `AFTER_COMMIT` (hiện tại) | `PublicLeadControllerTest` 7/7 xanh |
| đổi thành `BEFORE_COMMIT` | **ĐỎ** — `expected: 1L` |

Bài học mang đi: khi một test "không bắt được", câu hỏi đầu tiên là *cái gì đang nuốt tín hiệu*,
và đôi khi câu trả lời đúng là đổi cách quan sát chứ không phải gỡ lớp bảo vệ.

### U-02 — Commit message có BOM (INFO)

`git log --oneline` hiện `﻿feat: add admin-only user management...` — có một ký tự BOM UTF-8 ở
đầu dòng tiêu đề. Vô hại với git nhưng làm hỏng mọi thứ đọc tiêu đề bằng prefix (`git log
--grep='^feat'`, changelog generator, quy ước conventional-commit). Không sửa được mà không
rewrite history, nên để nguyên; chỉ cần lượt sau không lặp.

### U-03 — `deactivate` dùng `action = "DELETE"` (INFO)

Plan không chốt chuỗi này. `DELETE` hợp lý cho soft-delete và cột `audit_logs.action` là
`VARCHAR(16)` nên vừa. Ghi lại để plan 14 render đúng nhãn: một hàng "DELETE" trong lịch sử audit
thực chất là deactivate, dữ liệu không mất.

---

## Điều làm tốt

- **Khai M1 XANH và tuyên bố thẳng R-14 vẫn mở.** Lần thứ ba tự báo điểm yếu, và lần này là điểm
  yếu ở một thứ nó vừa được giao để đóng — kiểu báo cáo dễ giấu nhất. Nó còn nêu đúng nguyên nhân
  (listener bắt Exception), chính là đầu mối để tôi tìm ra cách quan sát khác.
- **Khai đủ 11 mutation** kèm thông điệp lỗi cụ thể từng cái. R-13 không tái phát.
- **Hai guard chống khoá chết admin panel làm đúng**, và guard "ADMIN cuối cùng" chỉ đếm khi mục
  tiêu đang `active` và có role `ADMIN` — không tốn query thừa cho trường hợp thường gặp.
- **Thứ tự guard hợp lý**: tự-deactivate kiểm trước last-admin, nên người dùng nhận thông báo cụ
  thể hơn thay vì một thông báo chung chung.
- `deactivate` revoke refresh token, và **không** thêm lại kiểm tra `isActive` ở login/refresh như
  plan đã dặn — đọc đúng phần "đã kiểm, có sẵn rồi".

---

## Kết luận

**VERDICT: PASS — `4339067` + `4a40bd1` + `c10adee`.**

120/120. Plan 10 xong, và đây là plan backend cuối cùng. U-01 là lỗi thật đã sửa, kèm test chặn
hồi quy có mutation chứng minh. R-14 — mở từ plan 09 — giờ đóng thật.

| Finding | Xử lý |
|---|---|
| **U-01** | **Đã sửa** (`c10adee`) — `create` trả `Long`, có test assert `entity_id` |
| **R-14** | **Đã đóng** (`c10adee`) — test đếm qua transaction `REQUIRES_NEW`, mutation đỏ |
| **R-08** | **Đã đóng** (`4339067`) — cap 5 token/user, M2 và M3 đỏ |
| U-02 | Ghi nhận — lượt sau đừng để BOM vào commit message |
| U-03 | Ghi nhận — plan 14 render "DELETE" của User là deactivate |
