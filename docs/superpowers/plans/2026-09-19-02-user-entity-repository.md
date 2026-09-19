# User Entity & Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `User` JPA entity, `Role` enum, and `UserRepository` on top of the `users` table created in plan 01.

**Architecture:** A single package `com.portfolio.platform.user` holding the entity/repository pair that every later auth and admin task depends on.

**Tech Stack:** Java 21, Spring Data JPA, Lombok, JUnit 5 + `@DataJpaTest`.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-01-backend-scaffold.md` (needs the `users` table from `V1__init_schema.sql`).

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

### Task: User entity, repository, and password hashing

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/user/User.java`
- Create: `backend/src/main/java/com/portfolio/platform/user/Role.java`
- Create: `backend/src/main/java/com/portfolio/platform/user/UserRepository.java`
- Test: `backend/src/test/java/com/portfolio/platform/user/UserRepositoryTest.java`

**Interfaces:**
- Consumes: schema from plan 01 (`users` table).
- Produces: `User` entity (`id`, `username`, `email`, `passwordHash`, `role: Role`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`); `UserRepository.findByUsername(String): Optional<User>`; `Role` enum `{ADMIN, EDITOR}` — consumed by plan 03 (auth) and plan 04 (audit context).

- [ ] **Step 1: Write the failing repository test**

```java
package com.portfolio.platform.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Test
    void findByUsername_returnsSavedUser() {
        User user = new User();
        user.setUsername("admin");
        user.setEmail("admin@portfolio.com");
        user.setPasswordHash("hashed");
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        var found = userRepository.findByUsername("admin");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("admin@portfolio.com");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=UserRepositoryTest`
Expected: FAIL — compile error, `User`/`Role`/`UserRepository` do not exist yet.

- [ ] **Step 3: Create `Role`**

```java
package com.portfolio.platform.user;

public enum Role {
    ADMIN,
    EDITOR
}
```

- [ ] **Step 4: Create `User` entity**

```java
package com.portfolio.platform.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

- [ ] **Step 5: Create `UserRepository`**

```java
package com.portfolio.platform.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=UserRepositoryTest`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/user backend/src/test/java/com/portfolio/platform/user
git commit -m "feat: add User entity, Role enum, and UserRepository"
```

## Self-Review Notes

- **Spec coverage:** matches the `users` table from spec section 6 field-for-field.
- **Type consistency:** `Role.ADMIN`/`Role.EDITOR` are the exact values used by `SecurityConfig.hasRole(...)` in plan 03 — do not introduce a third role value without updating that plan.
- **Next plan:** `2026-09-19-03-jwt-auth.md`.
