# Portfolio 3D Platform — Design Spec

Date: 2026-09-19
Status: Approved (sub-project 1 of the overall portfolio program)

## 1. Context & Scope

The company builds and sells ~20 website templates. This project is the
company's own portfolio site: a visually striking (3D) showcase of those
templates, backed by a Spring Boot admin system, deployed on a single
2GB VPS.

This spec covers **Sub-project 1: Portfolio Platform** only — the main
site, its 3D template carousel, the admin backend, and the deployment
infrastructure. It intentionally does NOT specify the 20 individual
templates; those are covered separately by:

- **Sub-project 2 — Template Design System** (not yet written): a shared
  spec describing the common structure/tech convention all 20 templates
  follow (all are static landing pages, same structure, different
  theme/content — confirmed with the user, no bespoke per-template
  features needed).

Out of scope for this spec: the content/design of individual templates,
detailed UI copy, and the CI/CD pipeline for template repos beyond what
is described in the deployment section.

## 2. Goals / Success Criteria

- Portfolio site loads fast and looks visually premium (3D carousel of
  templates) on desktop and mobile, with a non-WebGL fallback.
- Company can manage everything (templates, page content, leads, users,
  analytics) through an admin dashboard — no direct DB edits needed.
- Whole stack (portfolio FE + BE + DB + cache + 20 static template
  demos) runs on a single 2GB RAM VPS.
- Changes ship via CI/CD (GitHub → VPS) without manual SSH deploys.
- Production issues can be diagnosed via audit/error logs and a
  restricted debug SSH path, without needing full production access.

## 3. Architecture Overview

```
                         ┌─────────────────────────────┐
                         │   Nginx (reverse proxy)      │
                         │   - portfolio.com  -> FE      │
                         │   - api.portfolio.com -> BE    │
                         │   - demo1.portfolio.com -> static/01
                         │   - demo2..demo20.portfolio.com -> static/02..20
                         └───────────────┬───────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────┐
        │                                │                            │
┌───────▼─────────┐          ┌───────────▼───────────┐      ┌─────────▼─────────┐
│ Next.js Portfolio │          │ Spring Boot BE          │      │ 20x static builds   │
│ (SSR, 1 container) │          │ (JWT auth, 1 container)  │      │ (files only, no       │
│ - Home + 3D carousel│          │ - templates/content/media│      │  container, served    │
│ - /admin dashboard  │          │ - leads/analytics/audit  │      │  directly by Nginx)   │
│ - calls BE API       │          │ - settings/notifications │      └────────────────────┘
└────────────────────┘          └───────────┬────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                                     │
                 ┌────────▼────────┐                 ┌──────────▼─────────┐
                 │ PostgreSQL        │                 │ Redis (cache layer) │
                 │ (1 container)     │                 │ (1 container)       │
                 └───────────────────┘                 └────────────────────┘
```

**Containers running on the VPS: 5** — Nginx, Next.js portfolio, Spring
Boot BE, PostgreSQL, Redis. The 20 template demos are static files only
(no runtime process), mounted into Nginx's serving path.

Cloudflare (free tier) sits in front of the VPS as a CDN/proxy, caching
static assets and absorbing a large share of public traffic before it
reaches the VPS at all.

## 4. Frontend — Portfolio Site

**Stack:** Next.js (App Router, SSR/ISR) + React Three Fiber + drei for
the 3D carousel + TailwindCSS.

**Home page:**
- Hero section, company intro, services, contact form — content pulled
  from BE `content_sections` API, not hardcoded.
- **3D template carousel**: templates arranged in a rotating arc; each
  card is a textured plane (thumbnail image) in a React Three Fiber
  scene, not a full 3D model per template — keeps the scene lightweight
  while still giving a strong 3D visual effect. One shared 3D "frame"
  model (e.g. a laptop/monitor mockup) may wrap the thumbnail if desired
  for extra polish; this is a single shared asset, not 20 separate
  models.
- Card in focus enlarges; drag/swipe or arrow buttons rotate the
  carousel.
- Click a card -> modal opens with:
  - iframe preview of `demoN.portfolio.com`
  - "Open full demo" button (opens the subdomain in a new tab)
  - close button
- Non-WebGL fallback: a plain 2D carousel (e.g. Embla/Swiper) so the
  page never breaks on unsupported devices.

**Performance:**
- Thumbnails as compressed WebP; lazy-loaded as they enter/near the
  viewport instead of all 20 upfront.
- No heavy per-template 3D models.

**Admin dashboard:** lives inside the same Next.js app under `/admin`,
protected by middleware that validates the JWT (redirects to `/admin/login`
if missing/invalid/wrong role). This avoids running a second Next.js
container, saving RAM.

**Admin dashboard features:**
- Template CRUD (name, slug, subdomain, thumbnail, description,
  category, tech tags, display order, active/inactive, soft delete)
- Content section editor (hero/about/services/contact, versioned)
- Media library (upload/list/delete images used by templates & content)
- Leads list (status: new/contacted/closed, internal notes, assignment)
- User management (create/deactivate admin & editor accounts, role
  assignment)
- Analytics dashboard: visits over time, clicks per template, top
  templates, demo-open counts
- Audit log viewer: who changed what, when, before/after values
- System error log viewer: recent 5xx errors with stack trace, without
  needing SSH access to read log files
- Settings page: site title, SEO meta, social links, contact email

## 5. Backend — Spring Boot

**Modules:**
- `auth` — login, JWT access + refresh token, user/role management
  (ADMIN, EDITOR)
- `template` — CRUD templates, ordering/category, soft-delete, view/click
  counters
- `content` — CRUD content sections, versioned
- `media` — upload/manage media assets
- `lead` — CRUD leads, status workflow, notes
- `notification` — email notification on new lead (SMTP or transactional
  email provider)
- `analytics` — event ingestion (`POST /analytics/events`, public,
  rate-limited) + aggregation APIs for the dashboard
- `audit` — records every admin write/update/delete; separate error-log
  capture for 5xx responses
- `settings` — key/value site configuration

**Auth:** Spring Security + JWT (access token short-lived, refresh token
stored hashed in DB, revocable). Role-based authorization on all
`/admin/**` and mutating endpoints. Public endpoints: template listing
(GET), content sections (GET), lead submission (POST, rate-limited),
analytics event ingestion (POST, rate-limited).

**Caching & traffic control:**
- Redis caches public GET responses (template list, content sections)
  with a short TTL; cache entries are invalidated on the corresponding
  admin write (cache-aside pattern).
- Rate limiting (Bucket4j) on public POST endpoints (`leads`,
  `analytics/events`, `auth/login`) to prevent spam/brute force.
- Cloudflare in front of the VPS caches static assets independently of
  Redis — the two layers are complementary (Cloudflare: static/CDN edge,
  Redis: dynamic API response cache).

## 6. Database Schema (PostgreSQL)

```
users(id, username, email, password_hash, role, is_active, last_login_at, created_at, updated_at)
refresh_tokens(id, user_id, token_hash, expires_at, revoked, created_at)
templates(id, name, slug, subdomain, thumbnail_media_id, description, category, tech_tags, display_order, is_active, view_count, click_count, created_by, created_at, updated_at, deleted_at)
content_sections(id, section_key, data_json, version, updated_by, updated_at)
media(id, file_name, url, mime_type, size_bytes, uploaded_by, created_at)
leads(id, name, email, phone, message, source_template_id NULL, status, internal_note, assigned_to NULL, created_at, updated_at)
analytics_events(id, event_type, template_id NULL, session_id, ip_hash, user_agent, referrer, created_at)
audit_logs(id, user_id, action, entity_type, entity_id, old_value_json, new_value_json, ip_address, created_at)
system_error_logs(id, endpoint, http_status, exception_class, message, stacktrace, request_id, created_at)
settings(id, key, value_json, updated_by, updated_at)
```

Notes:
- `ip_hash` (not raw IP) in `analytics_events` to keep basic privacy
  hygiene while still allowing rough uniqueness/abuse analysis.
- `audit_logs` captures every admin CREATE/UPDATE/DELETE across
  `template`, `content`, `lead`, `user`, `settings`, `media` with
  before/after JSON snapshots.
- `system_error_logs` is written by a global exception handler
  whenever an API returns 5xx, so production issues are visible from
  the admin dashboard without SSH.

## 7. Deployment & Infrastructure

**Docker Compose services on the VPS**, with hard memory limits:

| Container | RAM limit |
|---|---|
| Nginx (reverse proxy + static demo serving) | ~30-50MB |
| Next.js portfolio (`node --max-old-space-size=300`) | ~350-400MB |
| Spring Boot BE (`-Xmx350m`) | ~400-450MB |
| PostgreSQL (tuned `shared_buffers`) | ~200-250MB |
| Redis (`maxmemory` capped) | ~80-120MB |
| Docker daemon + OS | ~250-300MB |
| **Total** | **~1.3-1.5GB / 2GB** |

This leaves ~500-700MB headroom for traffic spikes. A 2GB swap file is
required as a safety net. Given the added Redis container, a VPS
upgrade to 3-4GB RAM is recommended for long-term comfort, but the
above limits make 2GB workable.

**Static template hosting:** each of the 20 templates is built as a
static export (`next export` or equivalent) and deployed to
`/var/www/templates/<slug>/` on the VPS; Nginx serves it directly under
`<slug's subdomain>.portfolio.com` with no per-template runtime process.
Nginx config for these sites must not send `X-Frame-Options: DENY` /
restrictive `frame-ancestors` CSP, so they can be embedded in the
portfolio's iframe preview.

**DNS/SSL:** wildcard DNS record `*.portfolio.com` -> VPS IP. Wildcard
TLS certificate via Let's Encrypt DNS-01 challenge (via the DNS
provider's API, e.g. Cloudflare).

**CI/CD (GitHub Actions):**
1. Push to main -> Actions builds Docker images for the portfolio FE
   and Spring BE, pushes to GitHub Container Registry.
2. Actions SSHes into the VPS using a dedicated deploy key (GitHub
   Actions secret) and runs `docker compose pull && docker compose up -d`.
3. For the 20 static templates: build step syncs (`rsync`/`scp`) the
   static output to `/var/www/templates/<slug>/`; Nginx requires no
   restart since it just serves files.

**Debug SSH access for Claude:**
- A dedicated, non-sudo Linux user (e.g. `claude-debug`) is created on
  the VPS, scoped to read-only diagnostics: container logs
  (`docker logs`), container status (`docker ps`, `docker stats`),
  system resource usage (`free -m`, `df -h`), and journal logs within
  that user's permission scope.
- Uses its own SSH key, entirely separate from the CI/CD deploy key —
  it has no deploy or write capability.
- Implemented as a dedicated skill (e.g. `vps-debug-ssh`) that
  documents exactly which commands are permitted; any actual SSH
  command execution still goes through the normal tool-approval flow
  (no standing full-autonomy grant).

## 8. Error Handling

- All API errors return a structured JSON body (`code`, `message`,
  `requestId`); 5xx responses are additionally persisted to
  `system_error_logs` via a global `@ControllerAdvice` handler.
- Frontend shows a generic friendly error state on API failure and logs
  the `requestId` to the browser console for support/debugging.
- 3D scene failures (WebGL unsupported/context lost) fall back to the
  2D carousel rather than showing a blank/broken page.
- Rate-limited requests return `429` with a `Retry-After` header.

## 9. Testing Strategy

- Backend: unit tests per service/module (JUnit + Mockito, following
  the team's existing Java testing conventions), integration tests for
  auth flows and cache invalidation (Testcontainers for Postgres/Redis).
- Frontend: component tests for the carousel's non-3D logic (state,
  navigation), and a manual/visual check of the 3D scene and fallback
  path across at least one desktop and one mobile browser.
- Deployment: a staging VPS or local docker-compose run to validate the
  full stack (including RAM limits) before the first production deploy.

## 10. Open Items for Sub-project 2 (Template Design System)

Not designed here — to be brainstormed separately:
- Shared Next.js template starter (folder convention, required
  `public/thumbnail.webp`, `next.config.js` with `output: export`)
- Build/deploy convention so a template's `subdomain` in the `templates`
  table matches where CI publishes its static output
