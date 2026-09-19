# Nginx Reverse Proxy & Wildcard Subdomains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route `portfolio.com` to the frontend, `api.portfolio.com` to the backend, and `<slug>.portfolio.com` to each template's static build directory, with iframe embedding allowed.

**Architecture:** Three Nginx server blocks under `nginx/conf.d/`, mounted read-only into the `nginx` container from plan 15; the wildcard block captures the subdomain via a regex `server_name` and serves `/var/www/templates/$subdomain`.

**Tech Stack:** Nginx 1.27.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-15-docker.md` (needs the `frontend`/`backend` container names and the `templates-static` volume mount).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".

---

### Task: Nginx reverse proxy + wildcard subdomain static template serving

**Files:**
- Create: `nginx/conf.d/portfolio.conf`
- Create: `nginx/conf.d/api.conf`
- Create: `nginx/conf.d/templates.conf`
- Create: `templates-static/.gitkeep`

**Interfaces:**
- Consumes: `frontend` and `backend` container names from plan 15's `docker-compose.yml`.
- Produces: routing for `portfolio.com` → frontend, `api.portfolio.com` → backend, `*.portfolio.com` → `/var/www/templates/<subdomain-prefix>` — this is what CI (plan 17) publishes static template builds into, and what plan 12's `TemplatePreviewModal` iframe/demo link points at.

- [ ] **Step 1: Create `nginx/conf.d/portfolio.conf`**

```nginx
server {
    listen 80;
    server_name portfolio.com www.portfolio.com;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 2: Create `nginx/conf.d/api.conf`**

```nginx
server {
    listen 80;
    server_name api.portfolio.com;

    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        alias /data/media/;
    }
}
```

- [ ] **Step 3: Create `nginx/conf.d/templates.conf` (wildcard subdomain, static files, framing allowed)**

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>[a-z0-9-]+)\.portfolio\.com$;

    root /var/www/templates/$subdomain;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "" always;
    add_header Content-Security-Policy "frame-ancestors 'self' https://portfolio.com" always;
}
```

- [ ] **Step 4: Create the static templates mount placeholder**

```bash
mkdir -p templates-static
touch templates-static/.gitkeep
```

- [ ] **Step 5: Verify routing locally with a hosts-file override**

Run: add `127.0.0.1 portfolio.com api.portfolio.com demo1.portfolio.com` to the local hosts file, put a sample `index.html` in `templates-static/demo1/`, `docker compose restart nginx`, then `curl http://demo1.portfolio.com`
Expected: returns the sample `index.html` content; `curl http://api.portfolio.com/api/public/templates` returns `200`.

- [ ] **Step 6: Commit**

```bash
git add nginx templates-static/.gitkeep
git commit -m "feat: add Nginx routing for portfolio, API, and wildcard template subdomains"
```

## Self-Review Notes

- **Spec coverage:** implements spec section 7's Nginx routing (portfolio/API/wildcard subdomains) and the `X-Frame-Options`/CSP relaxation needed for plan 12's iframe preview.
- **Type consistency:** `location /media/` alias `/data/media/` matches plan 06's `MediaService` upload path (`/data/media`) and the URL prefix it returns (`/media/<file>`).
- **Next plan:** `2026-09-19-17-cicd.md`.
