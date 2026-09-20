# Code Review — Plan 17 (CI/CD)

**Ngày:** 2026-09-20
**Phạm vi:** commit `416b58e` (Task 0), `cb1adf1` (Task 1)
**Plan đối chiếu:** `docs/superpowers/plans/2026-09-19-17-cicd.md`
**Người viết code:** Antigravity, lượt 2 (lượt 1 cho ra 0/9 step)

## Trạng thái kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Task 0, step 0.1–0.3 | **Xong**, kể cả commit. Block `acme-challenge` đã bỏ, comment DNS-01 vào đúng chỗ |
| Task 1, step 1–4, 6 | **Xong**, kể cả commit |
| Step 5 (verify trên VPS) | **Không chạy được** — không có VPS/GHCR token/secrets. Khai báo trung thực |
| YAML hợp lệ | **Có** — `yaml.safe_load` parse sạch, 3 job |
| Trigger | `branches: [master]` ✅ — không phải `main` |
| Gating | `build.needs = test`, `deploy.needs = build` ✅ |
| `sync-templates.sh` | **Không tạo** ✅ — đúng, plan đã cố ý bỏ |
| Phạm vi | 4 file, không đẻ thêm plan/spec |
| Cây làm việc | Sạch |

Cả năm quyết định dễ bị "sửa cho gọn" đều giữ nguyên: nhánh `master`, test gate, tag theo SHA,
`build-args` cho `NEXT_PUBLIC_API_BASE_URL`, và `umask 077` trước khi ghi `.env`.

`docs/ops/ci-cd-secrets.md` còn có mục "Manual operations" đúng như Task 0 Step 0.2 yêu cầu —
nói rõ cert wildcard là thủ tục DNS-01 thủ công mà pipeline không làm.

---

## Phát hiện

> Cả bốn finding dưới đây là **lỗi trong plan tôi viết**. Antigravity implement đúng từng dòng.
> AD-01 đặc biệt đáng nói: tôi vừa viết một bài review tìm ra sáu lỗi xuyên plan, rồi tự tạo ra
> cái thứ bảy.

### AD-01 — Cổng kiểm tra sức khoẻ bị chính plan 16 vô hiệu hoá; deploy luôn báo thành công (MAJOR)

`deploy/deploy.sh`:

```bash
# Fail the deploy loudly if the backend did not come back up, rather than leaving CI green over
# a crash-looping container.
for _ in $(seq 1 30); do
  if curl -fsS http://localhost/api/public/templates >/dev/null 2>&1; then
    docker image prune -f
    echo "deploy ok"
    exit 0
  fi
  sleep 5
done
```

Nhưng sau plan 16, cổng 80 không còn phục vụ gì. `nginx/conf.d/00-redirect.conf`:

```nginx
server {
    listen 80 default_server;
    server_name _;
    location / { return 301 https://$host$request_uri; }
}
```

`curl -fsS` **không** có `-L`. `-f` chỉ coi HTTP ≥ 400 là lỗi, mà 301 không phải lỗi. Tôi dựng
một server trả 301 rồi chạy đúng lệnh trong `deploy.sh`:

```
$ curl -fsS http://127.0.0.1:18099/api/public/templates >/dev/null 2>&1; echo $?
0
```

Thoát **0**. Và nginx trả 301 đó **ngay lập tức** — nó không proxy gì, không phụ thuộc backend
(`depends_on: [frontend, backend]` chỉ xếp thứ tự khởi động container, không đợi healthy).

Nên vòng lặp thành công ở lần lặp đầu tiên, **bất kể backend có sống hay không**. Backend
crash-loop vì sai secret, vì migration hỏng, vì hết RAM — `deploy.sh` vẫn in `deploy ok` và
`exit 0`, và GitHub Actions vẫn xanh.

Toàn bộ mục đích của vòng lặp — đúng chữ trong comment ngay phía trên nó — bị vô hiệu. Tệ hơn
cả việc không có health check, vì cái comment khẳng định là có.

**Cách sửa:** đừng đi qua nginx. Vòng lặp này muốn biết *backend* có sống không, nên hỏi thẳng
backend, bỏ qua cả routing lẫn TLS:

```bash
if docker compose exec -T backend wget -qO- http://localhost:8080/actuator/health >/dev/null 2>&1; then
```

`/actuator/health` là `permitAll` trong `SecurityConfig`, và `eclipse-temurin:21-jre-alpine` có
sẵn `wget` của busybox. Cách này kiểm đúng thứ nó tuyên bố kiểm.

### AD-02 — Heredoc không trích dẫn: secret bị shell trên VPS diễn giải (MINOR)

```yaml
script: |
  cat > .env <<EOF
  IMAGE_TAG=${IMAGE_TAG}
  DB_PASSWORD=${{ secrets.DB_PASSWORD }}
  ...
  EOF
```

`<<EOF` không trích dẫn, nên shell trên VPS thực hiện **parameter expansion và command
substitution** trên thân heredoc. Với `${IMAGE_TAG}` đó là chủ ý. Nhưng `${{ secrets.X }}` được
GitHub thay **trước khi** script được gửi đi, nên **văn bản secret thật** nằm trong thân heredoc
rồi mới bị shell diễn giải.

Một secret chứa `$`, backtick hoặc `$(...)` sẽ bị mangle — hoặc thực thi — trên VPS.

`openssl rand -base64 32` (cách plan hướng dẫn) chỉ sinh `[A-Za-z0-9+/=]`, nên không rủi ro.
Nhưng `DB_PASSWORD` và `SMTP_PASSWORD` là loại người ta hay đặt tay. Một mật khẩu có `$` sẽ âm
thầm thành giá trị khác, và triệu chứng là Postgres từ chối xác thực — trông hệt như gõ sai mật
khẩu, ở một chỗ không ai nghĩ tới.

**Sửa:** đưa mọi secret vào `env:` của step, liệt kê chúng trong `envs:`, và dùng `<<'EOF'` có
trích dẫn.

### AD-03 — Step 4 của plan chỉ được ghi một nửa; lần deploy đầu tiên sẽ hỏng (MINOR)

Plan Step 4 yêu cầu ghi lại ba thứ chuẩn bị thủ công trên VPS. `docs/ops/ci-cd-secrets.md` có
**một**: mục nginx/cert thủ công.

Thiếu hai:

1. `sudo mkdir -p /opt/portfolio-3d-platform/{nginx/conf.d,nginx/certs,templates-static}` +
   `chown -R deploy:deploy`.
2. `echo <PAT> | docker login ghcr.io -u <user> --password-stdin` cho user `deploy`.

Cái thứ hai có hậu quả cụ thể: **package GHCR mặc định là private**. Không login thì
`docker compose pull` — lệnh **đầu tiên** của `deploy.sh` — trả 401 và `set -e` giết script.
Lần deploy đầu tiên hỏng, và thông điệp lỗi (`denied`) không gợi ý gì tới việc thiếu một bước
chuẩn bị chưa ai viết ra.

### AD-04 — Secret `PUBLIC_API_BASE_URL` không đặt thì hỏng im lặng, và `??` không cứu được (MINOR)

`build-args: NEXT_PUBLIC_API_BASE_URL=${{ secrets.PUBLIC_API_BASE_URL }}` — secret chưa đặt thì
GitHub thay bằng **chuỗi rỗng**, không phải bỏ trống.

`frontend/lib/apiClient.ts`:

```ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
```

`??` chỉ rơi về mặc định khi `null`/`undefined`. **Chuỗi rỗng không nullish**, nên `API_BASE`
thành `""` và mọi lời gọi trở thành URL tương đối: `fetch("/api/public/templates")`. Trình duyệt
gửi nó tới `portfolio.com`, nhưng API ở `api.portfolio.com` — nginx định tuyến `portfolio.com/api/**`
sang **frontend**, nên nhận 404.

Kết quả: build xanh, image push xong, container `Up`, và landing page trống không có template
nào. Đúng khuôn A-08 — *"không gì fail nếu env không đặt"* — thứ dự án đã phải dựng hẳn
`SecretsGuard` để chặn ở phía backend. Phía frontend chưa có gì tương đương.

**Sửa rẻ nhất:** một bước trong job `build` fail sớm nếu secret rỗng, ví dụ
`test -n "${{ secrets.PUBLIC_API_BASE_URL }}" || { echo "PUBLIC_API_BASE_URL is unset"; exit 1; }`.
Đổi `??` thành `||` trong `apiClient.ts` cũng che được, nhưng nó biến lỗi cấu hình thành im lặng
rơi về localhost — tệ hơn.

---

## Điều làm tốt

- **Task 0 làm đúng và gọn.** Block `acme-challenge` bị bỏ, comment giải thích cert đi qua DNS-01
  đặt trên `server {`, và `docs/ops/ci-cd-secrets.md` có mục "Manual operations" tương ứng — tức
  nó đọc cả Step 0.2 chứ không chỉ Step 0.1.
- **Không tạo `deploy/sync-templates.sh`.** Plan cố ý bỏ và ghi lý do trong Self-Review Notes;
  một công cụ chỉ đọc danh sách file rất dễ tạo lại nó.
- **`actions/setup-java@v4` với temurin 21** trong job `test` — CI không dính bẫy JDK 8 mà máy
  này dính. Không cần ai nhắc.
- **Lượt 2 sau một lượt 0/9**, và lần này viết file trước rồi mới tính chuyện kiểm — đúng điều
  chỉnh đã đưa vào lượt giao.

---

## Kết luận

**VERDICT: PASS có điều kiện — ship được, nhưng AD-01 phải sửa trước lần deploy thật đầu tiên.**

Workflow hợp lệ, gating đúng, trigger đúng nhánh, và cả năm quyết định thiết kế giữ nguyên.
Task 0 đóng AC-01.

Nhưng phải nói thẳng: **pipeline này chưa từng chạy**, và AD-01 nghĩa là ngay cả khi chạy, nó
**không thể báo hỏng** — `deploy.sh` sẽ in `deploy ok` cho một backend đã chết. Đó là trạng thái
tệ hơn "chưa có health check", vì nó tạo ra niềm tin sai.

| Finding | Mức | Xử lý |
|---|---|---|
| **AD-01** | MAJOR | **Phải sửa trước deploy thật** — hỏi thẳng `/actuator/health` của backend, đừng đi qua nginx |
| AD-02 | MINOR | Heredoc `<<'EOF'` + truyền secret qua `envs:` |
| AD-03 | MINOR | Bổ sung `mkdir`/`chown` và `docker login ghcr.io` vào ops doc |
| AD-04 | MINOR | Job `build` fail sớm khi `PUBLIC_API_BASE_URL` rỗng |
| ~~**AC-01**~~ | MINOR | **Đã đóng** — `416b58e` |
| ~~Z-20…Z-25~~ | MAJOR/MINOR | **Đã đóng về code**; **chưa xác nhận vận hành** |
| **F-01, R-03, A-11** | — | **Vẫn mở** — cần Docker |
