# Báo Cáo Khảo Sát Mức Độ Sẵn Sàng Frontend (Frontend Readiness Survey)

**Ngày khảo sát:** 2026-09-20  
**Repository:** `C:\openclaw-workspace\portfolio-3d-platform`  
**Git Branch:** `master` (HEAD `1980b38`)  
**Trạng thái Backend:** Hoàn tất 100%, 120/120 test PASS (`mvn test` BUILD SUCCESS) — Backend đóng băng, không chỉnh sửa bất kỳ file nào trong `backend/`.  
**Mục đích:** Khảo sát thực tế môi trường, cấu trúc repo và rà soát tính nhất quán giữa các kế hoạch frontend (`docs/superpowers/plans/2026-09-19-11-frontend-scaffold.md` đến `14-admin-dashboard-crud.md`), tài liệu thiết kế (`docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` các mục 4, 5, 7) với mã nguồn backend hiện có trước khi giao việc triển khai mã nguồn frontend.

---

## 1. Hiện trạng thư mục `frontend/` trong repository

### Kết quả kiểm tra
Thư mục `frontend/` **hoàn toàn chưa tồn tại** trong repository. Toàn bộ repo hiện tại cũng **chưa có bất kỳ file `package.json` nào**.

### Bằng chứng thực tế
1. Kiểm tra sự tồn tại của thư mục `frontend` bằng PowerShell:
   ```powershell
   PS C:\openclaw-workspace\portfolio-3d-platform> Test-Path frontend
   False
   ```
2. Liệt kê toàn bộ cấu trúc tại thư mục gốc repository:
   ```powershell
   PS C:\openclaw-workspace\portfolio-3d-platform> Get-ChildItem -Force
       Directory: C:\openclaw-workspace\portfolio-3d-platform
   Mode                 LastWriteTime         Length Name
   ----                 -------------         ------ ----
   d-----         9/20/2026   8:38 AM                .git
   d-----         9/20/2026   8:35 AM                backend
   d-----         9/19/2026   8:37 PM                docs
   -a----         9/19/2026   8:24 PM            140 .gitignore
   ```
   Tại root chỉ có: `.git/`, `backend/`, `docs/`, `.gitignore`.
3. Tìm kiếm file `package.json` trong toàn bộ cây thư mục repo:
   ```powershell
   PS C:\openclaw-workspace\portfolio-3d-platform> Get-ChildItem -Recurse -Filter "package.json"
   # Không có kết quả trả về (empty)
   ```

---

## 2. Phiên bản Node.js & npm trên máy và mức độ đáp ứng yêu cầu Next.js của Plan 11

### Kết quả kiểm tra
- **Node.js:** `v24.17.0`
- **npm:** `11.13.0`

### Bằng chứng thực tế
```cmd
PS C:\openclaw-workspace\portfolio-3d-platform> node -v
v24.17.0

PS C:\openclaw-workspace\portfolio-3d-platform> npm -v
11.13.0
```

### Đánh giá đáp ứng yêu cầu Next.js theo Plan 11
Plan 11 chỉ định sử dụng:
- `"next": "14.2.15"`
- `"react": "18.3.1"`, `"react-dom": "18.3.1"`
- `"typescript": "5.6.3"`
- `"@types/node": "22.7.5"`

1. **Khả năng đáp ứng yêu cầu tối thiểu:**
   - Theo tài liệu chính thức của Next.js 14.x: Next.js 14 yêu cầu môi trường **Node.js 18.17 trở lên** (`Node.js 18.17 or later`).
   - Phiên bản Node cài đặt trên máy là `v24.17.0` (và npm `11.13.0`), thỏa mãn điều kiện phiên bản tối thiểu (`>= 18.17.0`).

2. **Các điểm lệch và lưu ý rủi ro kỹ thuật cần điều chỉnh trong Plan 11:**
   - **Lệch type definition của Node:** Trong `package.json` của Plan 11 (dòng 70), devDependencies khai báo `"@types/node": "22.7.5"`, trong khi môi trường máy chủ đang chạy Node `v24.17.0`. Nên cập nhật `@types/node` lên phiên bản `^24` hoặc phiên bản tương thích với runtime thực tế.
   - **Tương thích hệ sinh thái trên Node 24 / npm 11:** Node 24 là phiên bản Current mới. Trong khi đó, Next.js 14.2.15 và các thư viện 3D như `@react-three/fiber: 8.17.10`, `@react-three/drei: 9.114.3`, `three: 0.169.0` được phát hành chủ yếu trên nền Node 18/20 LTS. Khi chạy `npm install` lần đầu tiên, có thể xuất hiện cảnh báo peer dependencies nếu npm 11 giải quyết các dependency lồng nhau nghiêm ngặt hơn. Cần chuẩn bị phương án thêm flag `--legacy-peer-deps` nếu có xung đột peer giữa React 18 và R3F/Drei.

---

## 3. Các endpoint backend được 4 plan tham chiếu và đối chiếu với Controller thực tế

### Bảng tổng hợp các endpoint được tham chiếu trong Plan 11, 12, 13, 14

| Endpoint | HTTP Method | Plan tham chiếu | Controller backend thực tế | Trạng thái trong Backend |
|---|---|---|---|---|
| `/api/public/templates` | `GET` | Plan 11 (L13, L43, L198), Plan 12 (L13, L286) | `PublicTemplateController.java` | **TỒN TẠI** |
| `/api/analytics/events` | `POST` | Plan 11 (L21, L212), Plan 12 (L220, L258) | `PublicAnalyticsController.java` | **TỒN TẠI** |
| `/api/auth/login` | `POST` | Plan 13 (L13, L114) | `AuthController.java` | **TỒN TẠI** |
| `/api/admin/templates` | `GET` | Plan 14 (L13, L48, L64, L182) | `AdminTemplateController.java` | **TỒN TẠI** |
| `/api/admin/analytics/summary` | `GET` | Plan 14 (L13, L48, L153) | `AdminAnalyticsController.java` | **TỒN TẠI** |
| `/api/admin/leads` | `GET` | Plan 14 (L13, L48, L104-122, L211) | *(Không có)* | **KHÔNG TỒN TẠI** |

*(Ghi chú: Các endpoint khác được nhắc đến trong Global Constraints như `GET /api/public/content-sections/{key}` hay `POST /api/public/leads` đều đã tồn tại trong backend ở `ContentSectionController.java` và `PublicLeadController.java`).*

### Chi tiết các endpoint TỒN TẠI trong code backend
1. **`GET /api/public/templates`**:
   - File: `backend/src/main/java/com/portfolio/platform/controller/PublicTemplateController.java` (dòng 12-25)
   - Mapping: `@RequestMapping("/api/public/templates")`, `@GetMapping public List<TemplateDto> listActive()`
2. **`POST /api/analytics/events`**:
   - File: `backend/src/main/java/com/portfolio/platform/controller/PublicAnalyticsController.java` (dòng 15-31)
   - Mapping: `@RequestMapping("/api/analytics")`, `@PostMapping("/events") public ResponseEntity<Void> track(@Valid @RequestBody TrackEventForm form, HttpServletRequest request)`
3. **`POST /api/auth/login`**:
   - File: `backend/src/main/java/com/portfolio/platform/controller/AuthController.java` (dòng 15-27)
   - Mapping: `@RequestMapping("/api/auth")`, `@PostMapping("/login") public ResponseEntity<TokenDto> login(@Valid @RequestBody LoginForm request)`
4. **`GET /api/admin/templates`**:
   - File: `backend/src/main/java/com/portfolio/platform/controller/AdminTemplateController.java` (dòng 14-26)
   - Mapping: `@RequestMapping("/api/admin/templates")`, `@GetMapping public List<TemplateDto> listAll()`
5. **`GET /api/admin/analytics/summary`**:
   - File: `backend/src/main/java/com/portfolio/platform/controller/AdminAnalyticsController.java` (dòng 10-23)
   - Mapping: `@RequestMapping("/api/admin/analytics")`, `@GetMapping("/summary") public AnalyticsSummaryDto summary()`

### Chi tiết endpoint KHÔNG TỒN TẠI: `GET /api/admin/leads`
- **Bằng chứng trong `backend/src/main/java/com/portfolio/platform/controller/`:**
  Toàn bộ danh sách controller hiện có gồm 10 file:
  1. `AdminAnalyticsController.java`
  2. `AdminTemplateController.java`
  3. `AdminUserController.java`
  4. `AuthController.java`
  5. `ContentSectionController.java`
  6. `MediaController.java`
  7. `PublicAnalyticsController.java`
  8. `PublicLeadController.java`
  9. `PublicTemplateController.java`
  10. `SettingsController.java`
  
  Liên quan đến domain `leads`, chỉ có duy nhất `PublicLeadController.java`:
  ```java
  @RestController
  @RequestMapping("/api/public/leads")
  public class PublicLeadController {
      @PostMapping
      public ResponseEntity<Void> submit(@Valid @RequestBody LeadCreateForm form) { ... }
  }
  ```
  **Không hề có `AdminLeadController.java`, không có `LeadController.java`, và không có bất kỳ method `@GetMapping` nào để xem danh sách leads.**
- **Mâu thuẫn và rủi ro trong Plan 14:**
  - Trong Plan 14, Step 5 (dòng 104-118) đề xuất can thiệp vào backend:
    ```
    - [ ] Step 5: Add GET /api/admin/leads to the backend (plan 07 follow-up)
    LeadRepository.java addition:
    java.util.List<Lead> findAllByOrderByCreatedAtDesc();

    LeadController.java: constructor-inject LeadRepository alongside the existing LeadService, then add:
    @GetMapping
    public java.util.List<Lead> listAll() {
        return leadRepository.findAllByOrderByCreatedAtDesc();
    }
    ```
  - **Sự cố kiến trúc:**
    1. **Vi phạm yêu cầu đóng băng Backend:** Backend đã hoàn thiện và 120/120 tests PASS; chỉ thị của dự án yêu cầu không sửa đổi bất kỳ code nào trong `backend/`.
    2. **Vi phạm nghiêm trọng Spec 5.1 (Layer Dependency Rules):** Đoạn code mà Plan 14 Step 5 định thêm sẽ tiêm trực tiếp `LeadRepository` vào controller. Quy tắc kiến trúc trong Spec 5.1 quy định rõ: *`Controller → Facade, Service`* và *`Never allowed: Controller → Repository`*. Nếu làm theo Step 5 của Plan 14, bài test kiến trúc `LayerDependencyTest` (ArchUnit) sẽ thất bại ngay lập tức (`BUILD FAILURE`).
    3. **Vi phạm Form vs Dto Ownership:** Step 5 của Plan 14 trả về trực tiếp danh sách JPA Entity `Lead`, trong khi Spec 5.1 bắt buộc response body ra ngoài frontend phải là `dto/*Dto` chứ không bao giờ trả về entity từ `model/`.

---

## 4. Đối chiếu các kiểu dữ liệu TypeScript (Plan 12, 14) với DTO thực tế trong `backend`

### 4.1. Kiểu `Template` (Plan 11 L183-193, được Plan 12 và Plan 14 sử dụng)

#### Định nghĩa trong TypeScript (Plan 11):
```ts
export type Template = {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  thumbnailMediaId?: number;
  description?: string;
  category?: string;
  techTags?: string;
  displayOrder?: number;
};
```

#### DTO thực tế trong Backend (`backend/src/main/java/com/portfolio/platform/dto/TemplateDto.java`):
```java
public record TemplateDto(
    Long id,
    String name,
    String slug,
    String subdomain,
    Long thumbnailMediaId,
    String description,
    String category,
    String techTags,
    int displayOrder,
    boolean active,
    long viewCount,
    long clickCount
)
```

#### Bảng đối chiếu từng trường:
| Trường trong DTO Java | Kiểu Java | Trường trong TS `Template` | Kiểu TypeScript | Tình trạng khớp / Lệch |
|---|---|---|---|---|
| `id` | `Long` | `id` | `number` | **Khớp** |
| `name` | `String` | `name` | `string` | **Khớp** |
| `slug` | `String` | `slug` | `string` | **Khớp** |
| `subdomain` | `String` | `subdomain` | `string` | **Khớp** |
| `thumbnailMediaId` | `Long` (nullable) | `thumbnailMediaId` | `number \| undefined` | **Khớp** |
| `description` | `String` (nullable) | `description` | `string \| undefined` | **Khớp** |
| `category` | `String` (nullable) | `category` | `string \| undefined` | **Khớp** |
| `techTags` | `String` (nullable) | `techTags` | `string \| undefined` | **Khớp** |
| `displayOrder` | `int` (primitive, non-null) | `displayOrder` | `number \| undefined` | **LỆCH TÍNH CHẤT:** DTO Java luôn trả về số nguyên `int` (mặc định 0), nhưng TS lại đánh dấu optional `?`. |
| `active` | `boolean` | *(Không có)* | *(Thiếu)* | **LỆCH: THIẾU TRƯỜNG.** Backend trả về `active: boolean` nhưng frontend TS hoàn toàn không khai báo. Ở Plan 14 Admin Templates table, trường này rất quan trọng để hiển thị trạng thái active/inactive. |
| `viewCount` | `long` | *(Không có)* | *(Thiếu)* | **LỆCH: THIẾU TRƯỜNG.** Backend trả về `viewCount: number` nhưng TS không có. |
| `clickCount` | `long` | *(Không có)* | *(Thiếu)* | **LỆCH: THIẾU TRƯỜNG.** Backend trả về `clickCount: number` nhưng TS không có. |

---

### 4.2. Kiểu `Summary` (Plan 14 L147)

#### Định nghĩa trong TypeScript (Plan 14):
```ts
type Summary = {
  totalViews: number;
  totalClicks: number;
  topTemplates: {
    templateId: number;
    clickCount: number;
  }[];
};
```

#### DTO thực tế trong Backend:
- `backend/src/main/java/com/portfolio/platform/dto/AnalyticsSummaryDto.java`:
  ```java
  public record AnalyticsSummaryDto(
      long totalViews,
      long totalClicks,
      List<TemplateClickCountDto> topTemplates
  )
  ```
- `backend/src/main/java/com/portfolio/platform/dto/TemplateClickCountDto.java`:
  ```java
  public record TemplateClickCountDto(
      Long templateId,
      long clickCount
  )
  ```

#### Đánh giá:
- **KHỚP HOÀN TOÀN.** Các tên trường `totalViews`, `totalClicks`, `topTemplates` (`templateId`, `clickCount`) và kiểu dữ liệu số (`long` map sang `number`) hoàn toàn trùng khớp giữa backend và frontend.

---

### 4.3. Kiểu `Lead` (Plan 14 L204)

#### Định nghĩa trong TypeScript (Plan 14):
```ts
type Lead = {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};
```

#### DTO thực tế trong Backend:
- **TRONG `backend/src/main/java/com/portfolio/platform/dto/` HOÀN TOÀN KHÔNG CÓ `LeadDto.java`!**
- Tại dòng 241 của Plan 14 thừa nhận: *"the `Summary`/`Lead` local TypeScript types mirror `AnalyticsSummaryDto` (plan 08) and the `Lead` entity's public fields (plan 07) exactly."*
- Điều này chứng minh: Kiểu `Lead` trong Plan 14 được tự suy diễn từ Entity JPA `Lead.java` (`backend/src/main/java/com/portfolio/platform/model/Lead.java`), chứ backend không có DTO này.
- **Nếu đối chiếu với Entity `Lead.java`:**
  - Entity `Lead` có: `id`, `name`, `email`, `phone`, `message`, `sourceTemplateId`, `status` (`LeadStatus` enum: `NEW`, `CONTACTED`, `CLOSED`), `internalNote`, `assignedTo`, `createdAt` (`Instant`), `updatedAt` (`Instant`).
  - TypeScript `Lead` trong Plan 14 chỉ chọn ra 5 trường: `id`, `name`, `email`, `status`, `createdAt`.
  - Kiểu `status` trong TS để `string` lỏng lẻo thay vì union type (`'NEW' | 'CONTACTED' | 'CLOSED'`).

---

### 4.4. Kiểu payload của `trackEvent` (Plan 11 L205-211, dùng ở Plan 12)

#### Định nghĩa trong TypeScript (Plan 11):
```ts
export async function trackEvent(payload: {
  eventType: "PAGE_VIEW" | "TEMPLATE_CLICK" | "DEMO_OPEN";
  templateId?: number;
  sessionId: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void>
```

#### Form tiếp nhận thực tế trong Backend (`backend/src/main/java/com/portfolio/platform/form/TrackEventForm.java`):
```java
public record TrackEventForm(
    @NotNull AnalyticsEventType eventType,
    Long templateId,
    @NotBlank @Size(max = 128) String sessionId
)
```

#### Đánh giá lệch:
- **Lệch trường trong Request Body:** Trong `PublicAnalyticsController.java` (dòng 26-28):
  ```java
  String clientIp = resolveClientIp(request);
  String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
  String referrer = request.getHeader(HttpHeaders.REFERER);
  analyticsService.track(form, clientIp, userAgent, referrer);
  ```
  Backend trích xuất `userAgent` và `referrer` trực tiếp từ **HTTP Headers** (`User-Agent` và `Referer`), chứ request body `TrackEventForm` không nhận 2 trường này. Việc Plan 11 đưa `userAgent` và `referrer` vào payload JSON body là dư thừa và không đúng với hợp đồng `TrackEventForm` của backend.

---

### 4.5. Kiểu phản hồi `POST /api/auth/login` (Plan 13 L123)

#### Sử dụng trong TypeScript (Plan 13):
```ts
const { accessToken } = await res.json();
```

#### DTO thực tế trong Backend (`backend/src/main/java/com/portfolio/platform/dto/TokenDto.java`):
```java
public record TokenDto(String accessToken, String refreshToken)
```

#### Đánh giá:
- **Khớp tên trường `accessToken`:** Frontend trích xuất đúng trường `accessToken` để lưu vào cookie `portfolio_access_token`. (Backend còn gửi thêm `refreshToken`, frontend hiện tại không dùng tới).

---

## 5. Kết luận và Khuyến nghị trước khi giao code

1. **Về môi trường & mã nguồn frontend:**
   - Thư mục `frontend/` chưa tồn tại.
   - Node `v24.17.0` và npm `11.13.0` sẵn sàng cho Next.js 14, nhưng Plan 11 cần điều chỉnh dependency `"@types/node"` cho phù hợp với Node 24.
2. **Về tính đồng bộ API và DTO:**
   - **Endpoint `/api/admin/leads` (GET):** Plan 14 đang giả định có endpoint này và thậm chí định viết code backend vi phạm quy tắc tầng. Vì backend đã đóng băng (120/120 pass, không sửa backend), **màn hình `/admin/leads` trong Plan 14 không thể gọi endpoint này**. Cần có quyết định: tạm thời mock dữ liệu ở frontend hoặc ẩn tính năng danh sách leads cho đến khi có một đợt cập nhật backend chính thức theo đúng quy chuẩn kiến trúc (tạo `LeadDto`, `LeadConverter`, `AdminLeadController`).
   - **Type `Template`:** Cần bổ sung các trường `active: boolean`, `viewCount: number`, `clickCount: number` vào `Template` type ở `frontend/lib/apiClient.ts` để khớp hoàn toàn với `TemplateDto` của backend.
   - **Hàm `trackEvent`:** Loại bỏ `userAgent` và `referrer` khỏi JSON payload body vì backend nhận qua request headers.
