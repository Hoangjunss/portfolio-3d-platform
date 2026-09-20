# Code review — plan 18b (route groups), lượt 1

**Ngày:** 2026-09-20
**Commit:** `d134096`
**Kết quả:** **7/7 step, PASS.** Phạm vi khớp tuyệt đối. Không có finding nào.

## Đã làm gì

    frontend/app/(public)/layout.tsx     | 3 +++
    frontend/app/{ => (public)}/page.tsx | 0

Hai file. Hết. `similarity index 100%` — dùng `git mv` thật chứ không phải xóa rồi tạo lại, nên
lịch sử của `page.tsx` còn nguyên.

## Tự kiểm (không tin báo cáo)

| Khẳng định của plan | Cách kiểm | Kết quả |
|---|---|---|
| `app/layout.tsx` không đổi | `git show --stat` | không có trong diff ✅ |
| `lang="en"` giữ nguyên | đọc file | `en`, không bị đổi thành `vi` ✅ |
| `app/admin/**` không bị động | `git show --stat` | không có trong diff ✅ |
| `admin/` không lọt vào `(public)` | `find frontend/app` | `app/admin/…`, ngoài `(public)` ✅ |
| Test cũ không hỏng | `npx vitest run` | **42/42 PASS**, 9 file ✅ |
| Build xanh + type-check xanh | `npm run build` | ✓ Compiled, ✓ types ✅ |
| `(public)` không thành URL segment | route table của build | liệt kê `/`, không có `/(public)/` ✅ |

## Kiểm runtime — phần build không trả lời được

STATUS.md ghi: với frontend, **test xanh + build xanh vẫn chưa đủ**. Nên chạy `npm start` thật:

| Request | Mã | Ý nghĩa |
|---|---|---|
| `GET /` | `200`, `<title>Portfolio</title>` | trang public vẫn ở đúng URL cũ sau khi bị move |
| `GET /(public)/` | `308` → `/(public)` → **`404`** | tên route group **không** truy cập được như một path |
| `GET /admin` | `307` | middleware vẫn chặn và đẩy về login |
| `GET /admin/login` | `200` | cây admin không bị ảnh hưởng |

Hai dòng giữa là thứ đáng giá nhất: Global Constraints của plan đòi chứng minh route group không
vào URL **bằng build + request thật, không phải bằng cách đọc tên thư mục**. Đã chứng minh đúng
kiểu đó — `(public)` trả 404.

`middleware.ts` có `matcher: ["/admin", "/admin/:path*"]`, không đụng gì tới cây public, nên việc
move không thể ảnh hưởng matcher. `307` ở `/admin` xác nhận điều đó ở runtime chứ không phải suy luận.

## Ghi chú

Mục tiêu thật của 18b — chặn `SiteNav`/`SiteFooter` rò sang `/admin/**` — **chưa kiểm được ở lượt
này**, vì `(public)/layout.tsx` đang là pass-through, chưa có gì để rò. Phép thử thật nằm ở **plan
19 Task 4**: sau khi mount, phải `curl /admin/login` và xác nhận HTML **không** chứa markup của
`SiteNav`/`SiteFooter`. Ghi lại đây để lượt review plan 19 không quên.

Đây là lượt thứ ba liên tiếp Antigravity làm đủ step, đúng phạm vi, **không bỏ bước commit** —
nối tiếp plan 16 và plan 13/14.
