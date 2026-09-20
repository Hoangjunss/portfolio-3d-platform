# Nginx Reverse Proxy & Wildcard Subdomains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Rewritten 2026-09-20** after plan review `docs/reviews/2026-09-20-plan-review-14-to-17.md`
> (3 MAJOR, 1 MINOR). Do not implement an older copy of this file.

> **This plan cannot be verified on the current machine** — it needs plan 15's running stack, and
> `docker: command not found` here.

**Goal:** Route `portfolio.com` to the frontend, `api.portfolio.com` to the backend, and
`*.portfolio.com` to statically exported template sites — over TLS, and passing through the
client's real IP.

**Architecture:** Three server blocks in `nginx/conf.d/`, each with an HTTP block that redirects
to HTTPS and an HTTPS block that does the work. The client IP travels in `X-Forwarded-For`, which
nginx **overwrites** rather than appends to.

**Tech Stack:** Nginx 1.27 (alpine), Let's Encrypt wildcard certificate.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-15-docker.md` (the compose network, service hostnames, and the
`media-data` volume mount this plan reads from).

> **Task 0 is not optional and comes first.** It repairs two defects plan 15 shipped with, both
> of them errors in plan 15's own text: a `.dockerignore` that Docker never reads, and a secrets
> guard that can be unwired without a single test noticing.

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".

---

## The client IP problem — read this before writing any config (closes N-01)

Two places in the backend read the client IP, and **they read it differently**:

| Where | Reads |
|---|---|
| `RateLimitFilter:64` | `request.getRemoteAddr()`, with the comment *"Key on getRemoteAddr() only, never X-Forwarded-For (spoofable by client)"* |
| `PublicAnalyticsController:38` | first hop of `X-Forwarded-For`, falling back to `getRemoteAddr()` |

Put nginx in front without handling this and `getRemoteAddr()` returns **the nginx container's
IP for every request in the world**. Concretely:

- `POST /api/auth/login` — 10 attempts per 15 minutes **shared by the entire internet**. One
  person fat-fingering their password ten times locks out every admin for 15 minutes.
- `POST /api/public/leads` — 5 leads per hour for the whole site.
- `analytics_events.ip_hash` — every visitor hashes to the same value, making all per-visitor
  analytics meaningless.

**That comment in `RateLimitFilter` is correct for the context it was written in.** When the app
is exposed directly, trusting `X-Forwarded-For` hands an attacker a free bucket-rotation knob.
The fix is not to delete the comment; it is to make the two halves true together:

1. nginx **overwrites** `X-Forwarded-For` with `$remote_addr` — using
   `proxy_set_header X-Forwarded-For $remote_addr`, **not** `$proxy_add_x_forwarded_for`. The
   `$proxy_add_*` variant *appends* to whatever the client sent, which leaves the client in
   control of the first hop and reintroduces exactly the spoofing the comment warns about.
2. the backend sets `server.forward-headers-strategy: framework` so `getRemoteAddr()` resolves
   through that header.

Doing only one of the two either changes nothing or opens the hole. Both steps are in this plan
and neither is optional.

---

## Decisions settled during plan review

- **(a) Every server block is HTTPS; port 80 only redirects.** Plan 15 already publishes 443 and
  mounts `./nginx/certs`, but the old copy of this plan only ever wrote `listen 80`. That
  combination silently breaks admin login: plan 13 decision (e) sets the session cookie with the
  `Secure` flag whenever `NODE_ENV === "production"`, which is exactly what the frontend
  container runs — and **browsers refuse to store a `Secure` cookie delivered over `http://`**.
  The user types the right password, gets a 200, the cookie is dropped without a word, the
  middleware sees nothing, and they land back on the login form. A login loop in which every
  individual step reports success.
- **(b) nginx overwrites `X-Forwarded-For`, and the backend trusts it.** See above.
- **(c) `/media/` is served with `Content-Disposition: attachment`** (M-01). Today's allow-list
  is `image/png`, `image/jpeg`, `image/webp` only, with magic-byte sniffing in
  `MediaServiceImpl` — so there is no live stored-XSS path. The header costs one line now and
  removes the need to remember this on the day somebody adds `image/svg+xml`.
- **(d) The wildcard block stays last and stays regex.** nginx matches exact `server_name`
  values before regex ones, so `portfolio.com`, `www.portfolio.com` and `api.portfolio.com` bind
  to their own blocks and never fall into the template block.

---

### Task 0: Fix two defects plan 15 shipped with (do this first)

Both come from `docs/reviews/2026-09-20-code-review-plan-15.md`. Both are errors in plan 15's
text, not in what was implemented from it — so fix them here rather than blaming the code.

**Files:**
- Create: `frontend/.dockerignore`
- Create: `backend/.dockerignore`
- Create: `backend/src/test/java/com/portfolio/platform/config/SecretsGuardWiringTest.java`

- [x] **Step 0.1: Give each build context its own `.dockerignore` (AB-01)**

Docker reads `.dockerignore` from the **root of the build context**, not the root of the repo.
`docker-compose.yml` declares `context: ./frontend` and `build: ./backend`, so the existing
repo-root `.dockerignore` is never read by either build.

The consequence is not slowness, it is a hard failure. `frontend/Dockerfile` does:

```dockerfile
RUN npm ci          # installs @next/swc-linux-x64-musl inside alpine
COPY . .            # overwrites node_modules with the host's copy
RUN npm run build   # dies here
```

The host tree is 560MB and `frontend/node_modules/@next/` contains only
`swc-win32-x64-msvc`. Copying that over the Alpine install makes Next unable to load its SWC
binary, so `docker compose build frontend` has never worked as written.

`frontend/.dockerignore`:

```
node_modules
.next
.env
.env.local
```

`backend/.dockerignore`:

```
target
```

Keep the repo-root `.dockerignore` as-is — it is harmless and would apply if anyone later builds
with the repository root as context. It simply cannot substitute for these two.

- [x] **Step 0.2: Write a test that fails when the secrets guard is unwired (AB-02)**

`SecretsGuardTest` calls `new SecretsGuard(env).verify()` directly. That proves the *logic* and
proves nothing about whether the class runs at startup. Both of these mutations currently leave
the suite **GREEN at 135/135**:

- delete `@Component` from `SecretsGuard` — it is no longer a bean, `@PostConstruct` never fires
- delete `@PostConstruct` — the bean exists but `verify()` is never called

Either deletion reopens A-08 in full: production goes back to
`dev-only-analytics-secret-change-me`, which is published in this repository, and every test
stays green. This is the same gap as **R-09** (nothing proves `@EnableScheduling` is still
there), which has been open since plan 03b — but with a worse consequence, because this guard is
the only thing standing between a deploy and a public secret.

```java
package com.portfolio.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SecretsGuardWiringTest {

    @Autowired(required = false)
    private SecretsGuard secretsGuard;

    // SecretsGuardTest calls verify() directly, so it stays green even if the class is no longer
    // a bean. Without this test, deleting one annotation silently reopens A-08 and lets a deploy
    // run on the development secret that is committed to this repository.
    @Test
    void theGuardIsRegisteredAsABeanSoItRunsAtStartup() {
        assertThat(secretsGuard)
                .as("SecretsGuard must be a Spring bean, or its @PostConstruct check never runs")
                .isNotNull();
    }
}
```

- [x] **Step 0.3: Verify — and prove the new test has weight**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

Expected: **136/136 PASS**.

Then run the mutation that this test exists for: delete `@Component` from `SecretsGuard`, re-run
`mvn -f backend/pom.xml -Dtest=SecretsGuardWiringTest test`, and confirm it is **RED**. Restore
it. Report the result.

Note what this test does **not** catch: deleting `@PostConstruct` alone leaves the bean present,
so this stays green. Catching that needs a test that activates the `prod` profile and expects the
context to refuse to start, which drags in real database configuration. **Leave that as an open
finding** rather than half-building it here — say so in the commit body.

- [x] **Step 0.4: Commit**

```bash
git add frontend/.dockerignore backend/.dockerignore backend/src/test/java/com/portfolio/platform/config/SecretsGuardWiringTest.java
git commit -m "fix: give each Docker build context its own ignore file and prove the secrets guard is wired"
```

---

### Task 1: Nginx reverse proxy, TLS, real client IP, and wildcard template subdomains

**Files:**
- Create: `nginx/conf.d/00-redirect.conf`
- Create: `nginx/conf.d/portfolio.conf`
- Create: `nginx/conf.d/api.conf`
- Create: `nginx/conf.d/templates.conf`
- Create: `nginx/certs/.gitkeep`
- Create: `templates-static/.gitkeep`
- Modify: `backend/src/main/resources/application.yml` — add `server.forward-headers-strategy`
- Test: `backend/src/test/java/com/portfolio/platform/filter/RateLimitForwardedIpTest.java`

**Interfaces:**
- Consumes: `frontend` and `backend` service hostnames, and the `media-data` volume, from plan 15.
- Produces: routing for `portfolio.com` → frontend, `api.portfolio.com` → backend,
  `*.portfolio.com` → `/var/www/templates/<subdomain>` — which is what plan 17 rsyncs into and
  what plan 12's `TemplatePreviewModal` iframe points at.

- [x] **Step 1: Teach the backend to trust the proxy header (half 2 of N-01)**

Add to `backend/src/main/resources/application.yml` under the existing `server:` key — check the
parent key before adding, per F-13; a second `server:` block silently overwrites the first and
`server.port` would disappear:

```yaml
server:
  port: 8080
  # N-01: behind Nginx, getRemoteAddr() is the proxy's container IP, so every client in the world
  # would share one rate-limit bucket. Safe only because nginx overwrites X-Forwarded-For with
  # $remote_addr rather than appending to what the client sent -- see nginx/conf.d/api.conf.
  forward-headers-strategy: framework
```

- [x] **Step 2: Write the failing test that proves the rate limiter keys on the forwarded IP**

`RateLimitForwardedIpTest` — the point is that two different forwarded IPs get two different
buckets, and the same forwarded IP shares one:

```java
@SpringBootTest
@AutoConfigureMockMvc
class RateLimitForwardedIpTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void twoDifferentForwardedIpsDoNotShareABucket() throws Exception {
        // /api/public/leads allows 5 per hour. Exhaust one IP completely...
        for (int i = 0; i < 5; i++) {
            postLead("203.0.113.10").andExpect(status().isCreated());
        }
        postLead("203.0.113.10").andExpect(status().isTooManyRequests());

        // ...the other must be untouched. Without forward-headers-strategy both requests carry
        // the same getRemoteAddr() and this line returns 429.
        postLead("203.0.113.99").andExpect(status().isCreated());
    }

    private ResultActions postLead(String forwardedIp) throws Exception {
        return mockMvc.perform(post("/api/public/leads")
                .header("X-Forwarded-For", forwardedIp)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"n\",\"email\":\"e@example.com\",\"message\":\"m\"}"));
    }
}
```

Adjust the request body to whatever `LeadForm` actually requires — read the record before
writing this, do not guess the field names.

Run `mvn -f backend/pom.xml test`: this test must **FAIL** before Step 1 is applied and **PASS**
after. If it passes both ways the test is not measuring anything; fix it before moving on.

- [x] **Step 3: Create `nginx/conf.d/00-redirect.conf`**

```nginx
# Decision (a): the session cookie carries the Secure flag in production, and browsers discard
# Secure cookies delivered over http. Serving any real content on port 80 would present a login
# form that succeeds and then silently fails to keep the user logged in.
server {
    listen 80 default_server;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

- [x] **Step 4: Create `nginx/conf.d/portfolio.conf`**

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name portfolio.com www.portfolio.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Decision (b): overwrite, never $proxy_add_x_forwarded_for -- that one appends to the
        # client-supplied value and leaves the first hop under the client's control.
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

- [x] **Step 5: Create `nginx/conf.d/api.conf`**

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name api.portfolio.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Matches spring.servlet.multipart.max-request-size (11MB). Leaving nginx at its 1MB default
    # would reject uploads with a 413 that never reaches the backend's own size check.
    client_max_body_size 11m;

    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }

    # Served from the media-data volume, which plan 15 mounts read-only into this container.
    location /media/ {
        alias /data/media/;
        # Decision (c) / M-01: the allow-list is png/jpeg/webp today, so nothing here executes in
        # a browser. This header is what keeps that true if the allow-list ever grows.
        add_header Content-Disposition "attachment" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}
```

- [x] **Step 6: Create `nginx/conf.d/templates.conf`**

```nginx
# Decision (d): regex server_names are matched only after every exact name, so portfolio.com,
# www.portfolio.com and api.portfolio.com bind to their own blocks and never land here.
server {
    listen 443 ssl;
    http2 on;
    server_name ~^(?<subdomain>[a-z0-9-]+)\.portfolio\.com$;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    root /var/www/templates/$subdomain;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Plan 12's preview modal frames these pages from the main site, so the default deny has to
    # be relaxed -- but only for that one origin.
    add_header Content-Security-Policy "frame-ancestors 'self' https://portfolio.com" always;
}
```

- [x] **Step 7: Create the mount placeholders**

```bash
mkdir -p templates-static nginx/certs
touch templates-static/.gitkeep nginx/certs/.gitkeep
```

Add `nginx/certs/*.pem` to `.gitignore` — private keys must never be committed.

For local verification, self-signed certs are enough:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout nginx/certs/privkey.pem -out nginx/certs/fullchain.pem \
  -subj "/CN=portfolio.com" -addext "subjectAltName=DNS:portfolio.com,DNS:*.portfolio.com"
```

Production uses a Let's Encrypt **wildcard** certificate (`*.portfolio.com`), which requires
DNS-01 validation — HTTP-01 cannot issue wildcards. Note this in the deploy docs; it is the one
piece of plan 16 that cannot be automated from inside the container.

- [ ] **Step 8: Verify routing — REQUIRES DOCKER**

Add to the local hosts file: `127.0.0.1 portfolio.com api.portfolio.com demo1.portfolio.com`.
Put a sample `index.html` in `templates-static/demo1/`. Then `docker compose up -d` and:

```bash
curl -ik https://demo1.portfolio.com                      # sample index.html
curl -ik https://api.portfolio.com/api/public/templates   # 200
curl -i  http://portfolio.com                             # 301 to https
```

Then the three checks that matter, none of which a 200 proves:

1. **Real client IP reaches the rate limiter (N-01).** From the host, hammer
   `https://api.portfolio.com/api/public/leads` 6 times — the 6th returns 429. Then run the same
   6 requests from a second source IP (another machine, or
   `docker compose exec backend curl ...` which arrives with a different address): the first must
   return 201, not 429. If it returns 429, `forward-headers-strategy` is not in effect and the
   whole site is still sharing one bucket.
2. **Admin login actually persists (decision (a)).** Log in at `https://portfolio.com/admin/login`
   and confirm the browser stores `portfolio_access_token` with the `Secure` attribute, then that
   `/admin` renders instead of bouncing. Repeat over `http://` and confirm it redirects to HTTPS
   before any form is shown.
3. **Uploaded media is reachable (Z-17).** Upload an image through the admin API, then
   `curl -ikI https://api.portfolio.com/media/<filename>` — expect `200` and a
   `Content-Disposition: attachment` header. A 404 here means the `media-data` mount is missing
   from the nginx service in `docker-compose.yml`, and every template thumbnail in the carousel
   is broken.

- [x] **Step 9: Commit**

```bash
git add nginx templates-static/.gitkeep .gitignore backend/src/main/resources/application.yml backend/src/test/java/com/portfolio/platform/filter/RateLimitForwardedIpTest.java
git commit -m "feat: add TLS Nginx routing that forwards the real client IP, closing N-01"
```

## Self-Review Notes

- **Spec coverage:** spec section 7's Nginx routing (portfolio / API / wildcard subdomains) plus
  the CSP relaxation plan 12's iframe preview needs.
- **Findings closed:** N-01 (Steps 1–2, verified at Step 8 check 1), M-01 (Step 5), Z-17 and
  Z-18 from the plan review.
- **Findings still open:** R-15 stands — `maximumSize(10_000)` on the bucket cache means a
  rotating-IP flood still degrades the limit to approximate. Real defence is a connection limit
  at the nginx layer, which is worth its own plan rather than a footnote here.
- **Not automatable:** the wildcard certificate needs DNS-01 validation, so issuance and renewal
  live outside the container. Plan 17 must not assume it can mint one during deploy.
- **Next plan:** `2026-09-19-17-cicd.md`.
