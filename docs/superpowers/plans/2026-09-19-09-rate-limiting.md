# Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revised:** 2026-09-20 — rewritten before hand-off. The previous draft used
`package com.portfolio.platform.ratelimit;` (pre-spec-5.1), kept an **unbounded** bucket map on a
process capped at `-Xmx350m`, returned a 429 with **no body** on a project whose whole error
contract is one JSON shape, applied **one** 5-per-minute limit to analytics (which would drop most
real traffic), listed the limited paths in two places that can drift, and proved the filter only
with a mocked unit test that would still pass if the filter were never wired in.

**Goal:** Two things.
1. Close the two carried-over findings that belong at the HTTP/transaction boundary (task 1).
2. Protect public write endpoints from spam/brute-force with per-IP rate limiting (task 2).

**Architecture:** `filter/RateLimitFilter` (an `OncePerRequestFilter`) + `config/RateLimitConfig`
+ `config/RateLimitProperties`, backed by Caffeine-bounded Bucket4j buckets keyed by `path:ip`.

**Tech Stack:** Bucket4j 8.14.0 (already in `pom.xml`), Caffeine (**to be added**), Spring
`OncePerRequestFilter`, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-01-backend-scaffold.md` (Bucket4j already declared);
`2026-09-19-07-lead-notification.md` and `2026-09-19-08-analytics.md` (task 1 fixes code those
plans delivered).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — **no unbounded in-memory collections**. Task 2 is the plan most able to break this; see decision (c).
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- **Nothing below 5xx may write a `system_error_logs` row.** Broken three times already (R-01, C-01, the malformed-body bug). A 429 must not write one either — and the test must assert it.
- **Every error response is an `ApiErrorDto` JSON body.** A filter sits outside `@RestControllerAdvice`, so it has to write that body itself — see decision (b).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** A
  `service/XService.java` entry always means the pair interface + `service/impl/XServiceImpl.java`.
- **Controllers never touch a Repository or a Converter**, schedulers and the `@RestControllerAdvice`
  never touch a Repository. `LayerDependencyTest` enforces this. **Do not widen its allow-list**
  unless a real import needs it — finding A-06 was exactly that mistake.
- Request bodies are `form/*Form`, response bodies and inter-layer data are `dto/*Dto`.
- **Constructor injection only.** No field `@Autowired`.
- Spring Boot **3.3.4** — test mock annotation is `org.springframework.boot.test.mock.mockito.MockBean`.
- Surefire filters are **comma**-separated: `-Dtest='A,B'`. Before every mutation check run
  `rm -f backend/target/surefire-reports/*.txt`.

---

## Task 1: Carried-over findings (L-01 second half, P-03)

**Files:**
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/LeadServiceImpl.java`
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/NotificationServiceImpl.java` (only if the listener lives there — see below)
- Create: `backend/src/main/java/com/portfolio/platform/dto/NewLeadEvent.java`
- Modify: `backend/src/main/java/com/portfolio/platform/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/test/java/com/portfolio/platform/service/LeadServiceTest.java`
- Modify: `backend/src/test/java/com/portfolio/platform/controller/PublicLeadControllerTest.java`
- Modify: `backend/src/test/java/com/portfolio/platform/exception/GlobalExceptionHandlerTest.java`

### Design decisions

**(a) Move the lead email out of the transaction — L-01's second half.** Today
`LeadServiceImpl.submit` is `@Transactional` and calls `notificationService.notifyNewLead(saved)`
inline. `0fbf9f1` bounded the SMTP timeouts to 5s, so the worst case is now a 5-second hang
instead of forever — but that 5 seconds still holds an open transaction and its pooled DB
connection, on an unauthenticated endpoint. Hikari's default pool is 10.

Replace the inline call with `ApplicationEventPublisher.publishEvent(new NewLeadEvent(id))` and
a `@TransactionalEventListener(phase = AFTER_COMMIT)` that calls `notifyNewLead`. Two consequences
to state in the commit body:

- The listener runs **after** commit, so the lead is already durable when the mail is attempted —
  which is exactly what decision (d) of plan 07 wanted, now structurally rather than by catching.
- The listener needs the `Lead`, and the entity from inside the transaction must not be passed
  across the boundary detached. Publish the **id** in `NewLeadEvent`, and have the listener load
  it. That is one extra SELECT per lead; leads are low-volume, and correctness wins.

`NotificationServiceImpl` keeps its `catch (MailException)` — belt and braces, and the
`AFTER_COMMIT` listener swallowing an exception silently is worse than logging it.

**(b) P-03: the 405 response must carry `Allow`.** RFC 9110 says a 405 SHOULD list the permitted
methods. `HttpRequestMethodNotSupportedException.getSupportedHttpMethods()` has them. Add the
header and **assert on the header**, not just the status — a test that only checks status would
pass with the header absent.

- [ ] **Step 1: Write the failing tests**

`LeadServiceTest` — the existing `submit_savesLeadWithNewStatusAndNotifies` verifies
`notificationService.notifyNewLead(...)` directly and **will break**, correctly: the service no
longer calls it. Replace that expectation with a mocked `ApplicationEventPublisher` and
`verify(publisher).publishEvent(any(NewLeadEvent.class))`. Keep every other assertion.

`PublicLeadControllerTest` — this is where the behaviour must still be proven end to end. It
already `@MockBean`s `NotificationService`; keep that and assert `notifyNewLead` **is** called
after a successful submit, so the listener is proven wired rather than assumed. Add a case where
the mail fails (`doThrow(new MailSendException(...))`) and assert the lead row still exists —
that is the whole point of the change.

`GlobalExceptionHandlerTest` — extend `wrongHttpMethod_returns405AndDoesNotLog` with
`.andExpect(header().string("Allow", containsString("POST")))`.

- [ ] **Step 2: Run to verify they fail**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
rm -f backend/target/surefire-reports/*.txt
mvn -f backend/pom.xml test -Dtest='LeadServiceTest,PublicLeadControllerTest,GlobalExceptionHandlerTest'
```

- [ ] **Step 3: Implement (a)** — `dto/NewLeadEvent` (a record holding `Long leadId`), publish it
from `LeadServiceImpl`, add the `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`.

Put the listener on a `@Component` in `service/impl` next to `NotificationServiceImpl`, or on
`NotificationServiceImpl` itself — **but not on `LeadServiceImpl`**, which would make the service
both publisher and subscriber of its own event.

- [ ] **Step 4: Implement (b)** — add the `Allow` header to the 405 handler.

- [ ] **Step 5: Full suite** — baseline **92 PASS**. Report the real number.

- [ ] **Step 6: Mutation checks**

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | change `AFTER_COMMIT` to `BEFORE_COMMIT` | **expected to stay GREEN** — no current test can tell the difference. Say so honestly; the finding is then that the phase is unproven, and the commit body must say which assertion would be needed (a listener that throws, asserting the lead still persisted) |
| M2 | drop the `Allow` header | the 405 test |
| M3 | make the listener synchronous again (call `notifyNewLead` inline in `submit`) | `LeadServiceTest` — publisher never invoked |

- [ ] **Step 7: Commit** — `fix: send the lead email after commit and add Allow to 405 responses`

---

## Task 2: Per-IP rate limiting on public write endpoints

**Files:**
- Modify: `backend/pom.xml` (add Caffeine)
- Create: `backend/src/main/java/com/portfolio/platform/config/RateLimitProperties.java`
- Create: `backend/src/main/java/com/portfolio/platform/filter/RateLimitFilter.java`
- Create: `backend/src/main/java/com/portfolio/platform/config/RateLimitConfig.java`
- Modify: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/com/portfolio/platform/filter/RateLimitFilterTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/filter/RateLimitIntegrationTest.java`

### Design decisions this task must follow

**(c) The bucket map must be bounded — this is the plan's own global constraint.** A plain
`ConcurrentHashMap<String, Bucket>` keyed by `path:ip` grows one entry per distinct IP **forever**.
On a 350MB heap that is not a leak to fix later, it is the attack: a client rotating source
addresses fills the heap, and the rate limiter becomes the denial of service it was added to
prevent.

Use a Caffeine cache — `maximumSize(10_000)` and `expireAfterAccess` of twice the longest refill
window — and add `com.github.ben-manes.caffeine:caffeine` to `pom.xml` (version managed by the
Boot parent, do not pin one). A bucket evicted while idle simply starts full again, which is the
correct behaviour for an idle client.

**Test it:** hammer the filter with 20_000 distinct IPs and assert the cache's
`estimatedSize()` stays at or below the maximum. Without that assertion the bound is decoration.

**(d) One limit for all three endpoints is wrong.** `/api/analytics/events` fires on page view
**and** on every template click — a real visitor browsing a portfolio trips 5-per-minute in
seconds, and the dashboard then under-counts silently. Per-path limits, from
`config/RateLimitProperties`:

| Path | Limit | Why |
|---|---|---|
| `/api/auth/login` | 10 per 15 min | brute-force is the threat; a human mistyping twice must not be locked out |
| `/api/public/leads` | 5 per hour | a real visitor submits once; spam is the threat |
| `/api/analytics/events` | 120 per min | must not throttle a real browsing session |

Put the numbers in `application.yml` under `rate-limit:` so plan 17 can tune them without a code
change.

**(e) The 429 must carry an `ApiErrorDto` JSON body.** The filter runs outside
`@RestControllerAdvice`, so nothing else will write one. Serialise
`new ApiErrorDto("RATE_LIMITED", "Too many requests", null)` with an injected `ObjectMapper`, set
`Content-Type: application/json`, and set `Retry-After` in **seconds**. Otherwise 429 becomes the
only response in the application with an empty body, breaking the single-error-shape contract
plan 04 established and findings R-04 / F-05 defended.

**(f) The path list lives in exactly one place.** The old draft had `LIMITED_PATHS` inside the
filter **and** `addUrlPatterns(...)` in the registration — two lists that will drift, and when
they do the failure is silent (an endpoint quietly unlimited). Keep the map in
`RateLimitProperties` and let the filter decide from it; register the filter with `/*` and let it
no-op on paths it does not know. Match on `request.getServletPath()` normalised for a trailing
slash, so `/api/public/leads/` cannot slip past.

**(g) Key on `getRemoteAddr()`, never on `X-Forwarded-For`.** Plan 08 decision (h) added an XFF
reader in `PublicAnalyticsController` **for analytics only**, with a comment saying the value is
forgeable. Rate limiting must not reuse it: a client that sets its own `X-Forwarded-For` would get
a fresh bucket per request and the limit would be worthless.

The flip side is a real problem plan 16 must solve: once nginx is in front,
`getRemoteAddr()` is nginx's address and **every visitor shares one bucket** — the whole site
rate-limited as a single client. The fix is **not** to read the header in application code, it is
`server.forward-headers-strategy: NATIVE` plus a trusted-proxy list, so Tomcat rewrites
`remoteAddr` only for traffic that really came through the proxy. **Write this requirement into
the commit body** so plan 16 inherits it, and add it to the STATUS findings table.

**(h) Bucket4j 8.14 API.** Prefer
`Bandwidth.builder().capacity(n).refillGreedy(n, Duration.ofX(..)).build()`. `Bandwidth.classic`
+ `Refill.greedy` still work but are deprecated. If the builder is not available in 8.14.0, use
the classic form and **say so in the commit body** rather than silently downgrading.

- [ ] **Step 1: Write the failing tests**

`RateLimitFilterTest` (unit, mocked request/response):
- `withinLimit_passesThrough`
- `overLimit_returns429WithJsonBodyAndRetryAfter` — assert status, the `Retry-After` header, the
  `Content-Type`, and that the written body parses to an `ApiErrorDto` with `code = RATE_LIMITED`
- `differentIps_haveIndependentBuckets`
- `unlistedPath_isNeverLimited` — 1_000 requests to `/api/public/templates`, all pass
- `bucketCache_staysBounded` — 20_000 distinct IPs, assert `estimatedSize()` ≤ maximum (decision (c))

`RateLimitIntegrationTest` (`@SpringBootTest` + `@AutoConfigureMockMvc`) — **the one that proves
the filter is actually wired**, which the old draft's mock-only test could never do:
- POST `/api/public/leads` 6 times with a valid body; assert the 6th is 429 with
  `code = RATE_LIMITED`, and that `systemErrorLogRepository.count()` did not move
- assert `/api/public/templates` (GET, unlisted) is never limited

Note for the implementer: give this test its own limits via `@TestPropertySource` so it does not
depend on production numbers, and remember `@MockBean NotificationService` so no SMTP socket opens.

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Add Caffeine to `pom.xml`, create `RateLimitProperties`**

`RateLimitProperties` holds a `Map<String, LimitSpec>` where `LimitSpec` is `(int capacity,
Duration window)`. `@ConfigurationPropertiesScan` is already on the application class.

- [ ] **Step 4: Create `RateLimitFilter` and `RateLimitConfig`**

Constructor takes `RateLimitProperties` and `ObjectMapper`. `RateLimitConfig` registers it with
`/*` and an order **after** Spring Security's chain (Security registers at
`SecurityProperties.DEFAULT_FILTER_ORDER`; any positive order is after it). State in a comment
that this ordering means a flood still walks the security chain first, and that moving the filter
earlier is a deliberate change, not a cleanup.

- [ ] **Step 5: Add the `rate-limit:` block to `application.yml`**

- [ ] **Step 6: Full suite** — report the real number.

- [ ] **Step 7: Mutation checks — run them, do not assume**

| # | Revert | Test that must go RED |
|---|---|---|
| M4 | replace the Caffeine cache with a plain `ConcurrentHashMap` | `bucketCache_staysBounded` |
| M5 | drop the JSON body, keep only `setStatus(429)` | `overLimit_returns429WithJsonBodyAndRetryAfter` |
| M6 | key the bucket on the path only, ignoring the IP | `differentIps_haveIndependentBuckets` |
| M7 | key the bucket on `X-Forwarded-For` when present | add an assertion that two requests from the same `remoteAddr` with **different** `X-Forwarded-For` values share one bucket — decision (g). If no test fails, the guard is unproven; say so |
| M8 | remove the filter registration entirely | `RateLimitIntegrationTest` — **this is the mutation the old plan could not have caught** |
| M9 | give every path the same limit | the integration test plus a unit case asserting analytics allows more than leads |

- [ ] **Step 8: Commit** — `feat: add bounded per-IP rate limiting on public write endpoints`

Commit body must record decisions (c), (d), (g) — including the nginx requirement plan 16
inherits — the Bucket4j API actually used per (h), and every mutation result honestly.

## Self-Review Notes

- **Spec coverage:** spec section 5's Bucket4j requirement for `leads`, `analytics/events`,
  `auth/login`, without breaking the RAM budget in section 7.
- **Closes:** L-01 second half, P-03.
- **Opens for plan 16:** `server.forward-headers-strategy` + trusted proxies, or every visitor
  shares one bucket. This is now the third thing plan 16 owes (with M-01 and D-03).
- **Not in this plan:** distributed rate limiting. Buckets are per-process; the VPS runs one
  instance (spec section 7), and a Redis-backed Bucket4j store is only worth it if that changes.
- **Next plan:** `2026-09-19-10-user-management.md`.
