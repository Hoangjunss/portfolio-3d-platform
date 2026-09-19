# Admin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an `ADMIN` create/deactivate `EDITOR`/`ADMIN` accounts, closing out the backend module list from spec section 5.

**Architecture:** Extends the `com.portfolio.platform.user` package (plan 02) with a management service/controller layer, gated to `ADMIN` only by the `SecurityConfig` rule already defined in plan 03.

**Tech Stack:** Spring Security `PasswordEncoder`, Spring Data JPA, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-02-user-entity-repository.md` (needs `User`, `UserRepository`, `Role`); `2026-09-19-03-jwt-auth.md` (needs `PasswordEncoder` bean and the `/api/admin/users/**` ADMIN-only rule); `2026-09-19-04-audit-error-logging.md` (needs `@Audited`).

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

### Task: User management module (admin-only)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/user/UserCreateRequest.java`
- Create: `backend/src/main/java/com/portfolio/platform/user/UserDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/user/UserManagementService.java`
- Create: `backend/src/main/java/com/portfolio/platform/user/UserManagementController.java`
- Test: `backend/src/test/java/com/portfolio/platform/user/UserManagementServiceTest.java`

**Interfaces:**
- Consumes: `User`, `UserRepository`, `Role` (plan 02); `Audited` (plan 04); `PasswordEncoder` bean (plan 03).
- Produces: `POST /api/admin/users` (ADMIN only, enforced by `SecurityConfig` from plan 03) → creates an `EDITOR` or `ADMIN` account with a BCrypt-hashed password; `GET /api/admin/users`, `DELETE /api/admin/users/{id}` (deactivate).

- [ ] **Step 1: Write the failing service test**

```java
package com.portfolio.platform.user;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks UserManagementService service;

    @Test
    void create_hashesPasswordBeforeSaving() {
        when(passwordEncoder.encode("plain")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.create(new UserCreateRequest("editor1", "editor1@portfolio.com", "plain", Role.EDITOR));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("hashed");
        assertThat(captor.getValue().getRole()).isEqualTo(Role.EDITOR);
    }

    @Test
    void deactivate_setsActiveFalse() {
        User existing = new User();
        existing.setId(3L);
        existing.setActive(true);
        when(userRepository.findById(3L)).thenReturn(java.util.Optional.of(existing));

        service.deactivate(3L);

        assertThat(existing.isActive()).isFalse();
        verify(userRepository).save(existing);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=UserManagementServiceTest`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Create `UserCreateRequest`, `UserDto`, `UserManagementService`, `UserManagementController`**

```java
package com.portfolio.platform.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserCreateRequest(
        @NotBlank String username, @Email @NotBlank String email,
        @NotBlank String password, @NotNull Role role) {
}
```

```java
package com.portfolio.platform.user;

public record UserDto(Long id, String username, String email, Role role, boolean active) {
    static UserDto from(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getRole(), u.isActive());
    }
}
```

```java
package com.portfolio.platform.user;

import com.portfolio.platform.audit.Audited;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserDto> listAll() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @Audited(entityType = "User", action = "CREATE")
    @Transactional
    public Long create(UserCreateRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        return userRepository.save(user).getId();
    }

    @Audited(entityType = "User", action = "UPDATE")
    @Transactional
    public void deactivate(Long id) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(false);
            userRepository.save(u);
        });
    }
}
```

```java
package com.portfolio.platform.user;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UserManagementController {

    private final UserManagementService service;

    public UserManagementController(UserManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserDto> listAll() {
        return service.listAll();
    }

    @PostMapping
    public Long create(@Valid @RequestBody UserCreateRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id) {
        service.deactivate(id);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=UserManagementServiceTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/user backend/src/test/java/com/portfolio/platform/user/UserManagementServiceTest.java
git commit -m "feat: add admin-only user management module"
```

## Self-Review Notes

- **Spec coverage:** closes out spec section 5's "User management" admin dashboard feature and the ADMIN-only rule from spec section 6/`SecurityConfig`.
- **Type consistency:** `UserDto` never exposes `passwordHash` — confirm any later admin UI (not currently planned beyond plan 14's scope) never requests it either.
- **This is the last backend module plan.** Next plan starts the frontend: `2026-09-19-11-frontend-scaffold.md`.
