# Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect public write endpoints from spam/brute-force with per-IP rate limiting, per spec section 5.

**Architecture:** A single `OncePerRequestFilter` (`RateLimitFilter`) backed by in-memory Bucket4j buckets keyed by `path:ip`, registered globally via a `FilterRegistrationBean`.

**Tech Stack:** Bucket4j, Spring `OncePerRequestFilter`, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-01-backend-scaffold.md` (needs the Bucket4j dependency already declared in `pom.xml`).

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

### Task: Rate limiting on public POST endpoints (Bucket4j filter)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/ratelimit/RateLimitFilter.java`
- Create: `backend/src/main/java/com/portfolio/platform/config/RateLimitConfig.java`
- Test: `backend/src/test/java/com/portfolio/platform/ratelimit/RateLimitFilterTest.java`

**Interfaces:**
- Consumes: nothing new.
- Produces: HTTP `429` with a `Retry-After` header once a client exceeds the per-IP bucket for `/api/public/leads`, `/api/analytics/events`, `/api/auth/login` — a globally-registered filter; no other plan depends on its internals.

- [ ] **Step 1: Write the failing filter test**

```java
package com.portfolio.platform.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    @Test
    void sixthRequestWithinWindow_isRejectedWith429() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(5, 1);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/public/leads");
        when(request.getRemoteAddr()).thenReturn("1.2.3.4");
        FilterChain chain = mock(FilterChain.class);
        AtomicInteger allowedCount = new AtomicInteger(0);
        doAnswer(inv -> allowedCount.incrementAndGet()).when(chain).doFilter(any(), any());

        for (int i = 0; i < 5; i++) {
            filter.doFilter(request, mock(HttpServletResponse.class), chain);
        }
        HttpServletResponse sixthResponse = mock(HttpServletResponse.class);
        filter.doFilter(request, sixthResponse, chain);

        assertThat(allowedCount.get()).isEqualTo(5);
        verify(sixthResponse).setStatus(429);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=RateLimitFilterTest`
Expected: FAIL — `RateLimitFilter` does not exist.

- [ ] **Step 3: Create `RateLimitFilter`**

```java
package com.portfolio.platform.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/public/leads", "/api/analytics/events", "/api/auth/login");

    private final int capacity;
    private final long refillMinutes;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(int capacity, long refillMinutes) {
        this.capacity = capacity;
        this.refillMinutes = refillMinutes;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!LIMITED_PATHS.contains(request.getRequestURI())) {
            chain.doFilter(request, response);
            return;
        }

        String key = request.getRequestURI() + ":" + request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.greedy(capacity, Duration.ofMinutes(refillMinutes))))
                .build());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(refillMinutes * 60));
        }
    }
}
```

- [ ] **Step 4: Register the filter bean**

```java
package com.portfolio.platform.config;

import com.portfolio.platform.ratelimit.RateLimitFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilter() {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RateLimitFilter(5, 1));
        registration.addUrlPatterns("/api/public/leads", "/api/analytics/events", "/api/auth/login");
        registration.setOrder(1);
        return registration;
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=RateLimitFilterTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/ratelimit backend/src/main/java/com/portfolio/platform/config/RateLimitConfig.java backend/src/test/java/com/portfolio/platform/ratelimit
git commit -m "feat: add per-IP rate limiting on public write endpoints"
```

## Self-Review Notes

- **Spec coverage:** implements spec section 5's Bucket4j rate-limiting requirement for `leads`, `analytics/events`, `auth/login`.
- **Type consistency:** `RateLimitFilter(capacity, refillMinutes)` constructor signature is fixed here — plan 17's production tuning (if any) must go through `RateLimitConfig`, not a signature change.
- **Next plan:** `2026-09-19-10-user-management.md`.
