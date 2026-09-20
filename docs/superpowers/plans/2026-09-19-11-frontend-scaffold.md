# Frontend Scaffold & API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revised:** 2026-09-20 — rewritten before hand-off, using the findings in
`docs/superpowers/frontend-readiness.md`. The previous draft's `Template` type was missing three
fields the backend actually returns, its `trackEvent` payload carried two fields the backend
ignores, and it left `GET /api/admin/leads` — which plan 14 depends on — missing, with plan 14
proposing to add it in a way that breaks spec 5.1.

**Goal:** Two things.
1. Add the one backend endpoint the frontend plans need and the backend does not have, built to
   spec 5.1 instead of the layer-violating snippet plan 14 currently carries (task 1).
2. Stand up the Next.js frontend with a typed client whose types match the real DTOs (task 2).

**Architecture:** Task 1 is backend, layered per spec 5.1. Task 2 is a single Next.js App Router
project in `frontend/` with TailwindCSS and a `lib/apiClient.ts` every later frontend plan imports.

**Tech Stack:** Next.js 14 (App Router), TypeScript, TailwindCSS, Vitest.
**Verified on this machine:** Node `v24.17.0`, npm `11.13.0` — both above Next.js 14's floor of
Node 18.17.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** plan 05 (`TemplateDto`), plan 07 (`Lead`, `LeadRepository`), plan 08
(`TrackEventForm`).

## Global Constraints

- Backend must run within `-Xmx350m` — **no unbounded in-memory collections, use pagination on list endpoints.** Task 1 is a list endpoint; see decision (b).
- All admin-mutating endpoints under `/api/admin/**` require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row; every 5xx response must write a `system_error_logs` row.
- **Nothing below 5xx may write a `system_error_logs` row.**
- **Every error response is an `ApiErrorDto` JSON body.**
- Public GET endpoints are Redis-cached; public POST endpoints are rate-limited.
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP.
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`.
- No comments restating what code does; only comments explaining non-obvious "why".
- **Backend package layout follows spec section 5.1 (layered).** `service/XService.java` always means interface + `service/impl/XServiceImpl.java`. Mapping lives in `converter/`, never as a static factory on a DTO.
- **Controllers never touch a Repository.** `LayerDependencyTest` enforces this — **but read finding A-04 first**: it is a hand-written import scanner, **not ArchUnit**, and it is blind to fully-qualified references. A green build is not proof; write the layering correctly rather than around the test.
- **Do not widen `LayerDependencyTest`'s allow-list** unless a real import needs it (finding A-06).
- **Constructor injection only.** Spring Boot **3.3.4** — `org.springframework.boot.test.mock.mockito.MockBean`.
- Surefire filters are **comma**-separated; `rm -f backend/target/surefire-reports/*.txt` before every mutation check.
- **Report every mutation result, including the ones that stay GREEN.**

---

## Task 1: `GET /api/admin/leads`, built to spec 5.1

Plan 14's admin leads screen calls this endpoint. It does not exist — `PublicLeadController` has
only `@PostMapping`, and there is no `AdminLeadController`. Plan 14 currently proposes to fix that
by injecting `LeadRepository` into a controller and returning a `List<Lead>` of JPA entities.
Both halves break spec 5.1, so build it properly here instead, and delete that step from plan 14.

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/dto/LeadDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/converter/LeadConverter.java` + `converter/impl/LeadConverterImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminLeadController.java`
- Modify: `backend/src/main/java/com/portfolio/platform/service/LeadService.java` + `impl`
- Modify: `docs/superpowers/plans/2026-09-19-14-admin-dashboard-crud.md` (delete its Step 5)
- Test: `backend/src/test/java/com/portfolio/platform/controller/AdminLeadControllerTest.java`
- Test: modify `backend/src/test/java/com/portfolio/platform/service/LeadServiceTest.java`

### Design decisions

**(a) `LeadDto` must not carry every column.** The entity has `internalNote` and `assignedTo`,
which are operational fields, plus `phone` and `message`, which are the visitor's own words.
Expose `id, name, email, phone, message, sourceTemplateId, status, createdAt`. Leave
`internalNote` and `assignedTo` out until a plan actually renders them — a DTO is a contract, and
the cheapest time to not expose a field is before anything consumes it.

**(b) Paginate.** `Page<LeadDto> list(Pageable)` with `@PageableDefault(size = 20)` on the
controller, same shape as `AdminUserController`. Leads are the one table that grows with traffic;
an unpaginated `findAll` on it is the RAM-budget constraint's own example.

**(c) Sort newest first, in the query, not in memory.** `@PageableDefault(sort = "createdAt",
direction = Sort.Direction.DESC)`. Sorting a page after fetching it sorts only that page.

**(d) `status` serialises as the enum name.** `LeadStatus` is `@Enumerated(STRING)` and plan 14's
TypeScript expects `'NEW' | 'CONTACTED' | 'CLOSED'`. Keep the DTO field typed `LeadStatus` so
Jackson writes the name; do not convert to `String` in the converter.

**(e) These are attacker-authored strings.** `name`, `email`, `phone` and `message` come from an
unauthenticated public form (findings C-04, L-05). Nothing to do on the backend — they are stored
as given, deliberately — but this DTO is where they cross into the admin UI, so say it in a
comment so plan 14 does not have to rediscover it.

- [ ] **Step 1: Write the failing tests**

`AdminLeadControllerTest` (`@SpringBootTest`, `@MockBean NotificationService`):
- `list_asAdmin_returnsPageOfLeadsNewestFirst` — seed three leads with distinct `createdAt`,
  assert order and page metadata
- `list_asEditor_returns200` — EDITOR may read leads (`/api/admin/**` allows ADMIN and EDITOR;
  only users and settings are ADMIN-only). **If this comes back 403, the rule is stricter than I
  read it — report that instead of changing `SecurityConfig`.**
- `list_unauthenticated_returns401`
- `list_neverExposesInternalNote` — assert `jsonPath("$.content[0].internalNote").doesNotExist()`

`LeadServiceTest`: `list_returnsConvertedPage`.

- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Create `LeadDto` and the converter pair.**
- [ ] **Step 4: Add `Page<LeadDto> list(Pageable)` to `LeadService` + impl** (`@Transactional(readOnly = true)`).
- [ ] **Step 5: Create `AdminLeadController`.**
- [ ] **Step 6: Delete Step 5 from plan 14** and replace it with a line pointing here.
- [ ] **Step 7: Full suite** — baseline **120 PASS**. Report the real number.
- [ ] **Step 8: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | drop the `DESC` sort default | `list_asAdmin_returnsPageOfLeadsNewestFirst` |
| M2 | add `internalNote` to `LeadDto` | `list_neverExposesInternalNote` |
| M3 | return `List<LeadDto>` instead of `Page` | the page-metadata assertion |

- [ ] **Step 9: Commit** — `feat: add paginated admin leads endpoint`

---

## Task 2: Next.js scaffold + typed API client

**Files:**
- Create: `frontend/package.json`, `frontend/next.config.mjs`, `frontend/tsconfig.json`,
  `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/app/globals.css`,
  `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/lib/apiClient.ts`
- Test: `frontend/lib/apiClient.test.ts`

`.gitignore` at the repo root already covers `node_modules/`, `.next/` and `out/` — **verified**,
no change needed.

### Design decisions

**(f) The `Template` type must match `TemplateDto`, which has twelve fields, not nine.** The old
draft omitted `active`, `viewCount` and `clickCount`, and marked `displayOrder` optional when the
backend returns a primitive `int` that is never absent. Plan 14's admin table needs `active` to
show status, and plan 12/14 need the counters — `viewCount` only started being written in plan 08.

```ts
export type Template = {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  thumbnailMediaId: number | null;
  description: string | null;
  category: string | null;
  techTags: string | null;
  displayOrder: number;
  active: boolean;
  viewCount: number;
  clickCount: number;
};
```

`null`, not `?`: these columns are nullable, so Jackson emits `"description": null` rather than
omitting the key. `?` would type a key that is always present as possibly missing.

**(g) `trackEvent` must not send `userAgent` or `referrer`.** `TrackEventForm` is
`(eventType, templateId, sessionId)` only — `PublicAnalyticsController` reads `User-Agent` and
`Referer` from the request headers (plan 08 decision (e), so the client cannot report a UA
different from the one it actually sent). Extra JSON keys are ignored today, but shipping a
payload that implies the backend honours them is a trap for the next reader.

**(h) A failed analytics call must never break a page.** `await fetch(...)` with no `catch` means
a network failure rejects and, in a component, surfaces as an unhandled rejection. Wrap the call
so `trackEvent` always resolves, and say why in a comment: analytics is best-effort, exactly like
the lead email.

**(i) `getTemplates` needs a timeout.** It runs in a server component; without one, a hung backend
hangs the render until the platform's own timeout. Use `AbortSignal.timeout(5000)` — the same
5-second bound plan 09 put on SMTP, for the same reason.

**(j) `@types/node` vs the runtime.** The draft pins `22.7.5` while this machine runs Node 24.
Use `^24`. If install resolves badly, keep `22.7.5` and **say so in the commit body** — a
mismatch here only affects typings for newer Node APIs, so it is a note, not a blocker. Same for
any React 18 / R3F peer warnings: report them, do not silently add `--legacy-peer-deps`.

- [ ] **Step 1: `package.json`** — the draft's version list, with `@types/node` per (j).
- [ ] **Step 2: `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`.**
- [ ] **Step 3: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`.**
- [ ] **Step 4: Write `lib/apiClient.test.ts`** — mock `global.fetch`; cover: `getTemplates` parses
  a full twelve-field payload; `getTemplates` throws on a non-2xx; **`trackEvent` resolves when
  `fetch` rejects** (decision (h)); `trackEvent` sends exactly three keys (decision (g)).
- [ ] **Step 5: Run to verify it fails.**
- [ ] **Step 6: Create `lib/apiClient.ts`.**
- [ ] **Step 7: `cd frontend && npm install && npx vitest run`** — report the real result, and any
  peer-dependency warnings verbatim.
- [ ] **Step 8: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | remove the try/catch in `trackEvent` | the rejecting-fetch case |
| M5 | add `userAgent` back to the payload | the exactly-three-keys assertion |
| M6 | drop the `res.ok` check in `getTemplates` | the non-2xx case |

- [ ] **Step 9: Commit** — `feat: scaffold Next.js frontend with a typed API client`

## Self-Review Notes

- **Spec coverage:** spec section 4's Next.js/Tailwind stack; task 1 closes the last backend gap
  the frontend plans depend on.
- **Type consistency:** `Template` now mirrors all twelve `TemplateDto` fields. `LeadDto` is new
  and plan 14's local `Lead` type must be regenerated from it, not from the JPA entity.
- **Carried into plan 14:** C-04 / L-05 (lead and media strings are attacker-authored — the risk
  is `dangerouslySetInnerHTML` and `href`/`src`, not ordinary React rendering), A-09 (the summary
  endpoint is uncached and runs three queries per call), U-03 (a `DELETE` audit row for a user is
  a deactivation, not a deletion).
- **Next plan:** `2026-09-19-12-3d-carousel.md`.
