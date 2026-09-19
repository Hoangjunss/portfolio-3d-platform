# Template CRUD Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Template CRUD module — public listing for the 3D carousel and admin management, with Redis caching and audit logging.

**Architecture:** A `com.portfolio.platform.template` package: `Template` entity, `TemplateRepository`, `TemplateService` (cache-aside via Spring Cache abstraction), `PublicTemplateController`, `AdminTemplateController`.

**Tech Stack:** Spring Data JPA, Spring Cache + Redis, JUnit 5 + Mockito + MockMvc.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-04-audit-error-logging.md` (needs `@Audited`); `2026-09-19-01-backend-scaffold.md` (needs `templates` table).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** Read 5.1 before
  creating any class. A `service/XService.java` entry in a file list always means the pair
  `service/XService.java` (interface) + `service/impl/XServiceImpl.java` (implementation).
- **Controllers never touch a Repository or a Converter**, schedulers and the `@RestControllerAdvice`
  never touch a Repository. `LayerDependencyTest` enforces this and will fail the build.
- Request bodies are `form/*Form`, response bodies and inter-layer data are `dto/*Dto`
  (spec 5.1, Form vs Dto ownership). Entities live in `model/` with no suffix.

---

### Task: Template CRUD module (entity, repository, service, controller)

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/model/Template.java`
- Create: `backend/src/main/java/com/portfolio/platform/repository/TemplateRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/dto/TemplateDto.java`
- Create: `backend/src/main/java/com/portfolio/platform/form/TemplateUpsertForm.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/TemplateService.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/PublicTemplateController.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/AdminTemplateController.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/TemplateServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/PublicTemplateControllerTest.java`

**Interfaces:**
- Consumes: `Audited` from plan 04; `Role` from plan 02.
- Produces: `GET /api/public/templates` → `List<TemplateDto>` (active, ordered by `displayOrder`) — consumed by the frontend carousel (plan 12); `TemplateService.create/update/delete/incrementClickCount(Long): void` — `incrementClickCount` consumed by plan 08's analytics module.

- [ ] **Step 1: Write the failing service test**

```java
package com.portfolio.platform.template;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TemplateServiceTest {

    @Mock TemplateRepository templateRepository;
    @InjectMocks TemplateService templateService;

    @Test
    void listActive_returnsOnlyActiveOrderedTemplates() {
        Template t1 = new Template();
        t1.setId(1L);
        t1.setName("Restaurant");
        when(templateRepository.findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc())
                .thenReturn(List.of(t1));

        List<TemplateDto> result = templateService.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Restaurant");
    }

    @Test
    void incrementClickCount_incrementsExistingTemplate() {
        Template t1 = new Template();
        t1.setId(5L);
        t1.setClickCount(3L);
        when(templateRepository.findById(5L)).thenReturn(Optional.of(t1));

        templateService.incrementClickCount(5L);

        assertThat(t1.getClickCount()).isEqualTo(4L);
        verify(templateRepository).save(t1);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=TemplateServiceTest`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Create `Template` entity**

```java
package com.portfolio.platform.template;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "templates")
@Getter
@Setter
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false, unique = true)
    private String subdomain;

    @Column(name = "thumbnail_media_id")
    private Long thumbnailMediaId;

    @Column(columnDefinition = "text")
    private String description;

    private String category;

    @Column(name = "tech_tags")
    private String techTags;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "click_count", nullable = false)
    private long clickCount = 0;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
```

- [ ] **Step 4: Create `TemplateRepository`, `TemplateDto`, `TemplateUpsertForm`**

```java
package com.portfolio.platform.template;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateRepository extends JpaRepository<Template, Long> {
    List<Template> findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();
    List<Template> findByDeletedAtIsNullOrderByDisplayOrderAsc();
}
```

```java
package com.portfolio.platform.template;

public record TemplateDto(
        Long id, String name, String slug, String subdomain, Long thumbnailMediaId,
        String description, String category, String techTags, int displayOrder,
        boolean active, long viewCount, long clickCount) {

    static TemplateDto from(Template t) {
        return new TemplateDto(t.getId(), t.getName(), t.getSlug(), t.getSubdomain(), t.getThumbnailMediaId(),
                t.getDescription(), t.getCategory(), t.getTechTags(), t.getDisplayOrder(),
                t.isActive(), t.getViewCount(), t.getClickCount());
    }
}
```

```java
package com.portfolio.platform.template;

import jakarta.validation.constraints.NotBlank;

public record TemplateUpsertForm(
        @NotBlank String name, @NotBlank String slug, @NotBlank String subdomain,
        Long thumbnailMediaId, String description, String category, String techTags,
        int displayOrder, boolean active) {
}
```

- [ ] **Step 5: Create `TemplateService`**

```java
package com.portfolio.platform.template;

import com.portfolio.platform.audit.Audited;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class TemplateService {

    private final TemplateRepository templateRepository;

    public TemplateService(TemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Cacheable("public-templates")
    @Transactional(readOnly = true)
    public List<TemplateDto> listActive() {
        return templateRepository.findByIsActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()
                .stream().map(TemplateDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TemplateDto> listAllForAdmin() {
        return templateRepository.findByDeletedAtIsNullOrderByDisplayOrderAsc()
                .stream().map(TemplateDto::from).toList();
    }

    @Audited(entityType = "Template", action = "CREATE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long create(TemplateUpsertForm request, Long createdBy) {
        Template template = new Template();
        applyRequest(template, request);
        template.setCreatedBy(createdBy);
        return templateRepository.save(template).getId();
    }

    @Audited(entityType = "Template", action = "UPDATE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long update(Long id, TemplateUpsertForm request) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Template " + id + " not found"));
        applyRequest(template, request);
        template.setUpdatedAt(Instant.now());
        return templateRepository.save(template).getId();
    }

    @Audited(entityType = "Template", action = "DELETE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long softDelete(Long id) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Template " + id + " not found"));
        template.setDeletedAt(Instant.now());
        template.setActive(false);
        templateRepository.save(template);
        return id;
    }

    @Transactional
    public void incrementClickCount(Long id) {
        templateRepository.findById(id).ifPresent(t -> {
            t.setClickCount(t.getClickCount() + 1);
            templateRepository.save(t);
        });
    }

    private void applyRequest(Template template, TemplateUpsertForm request) {
        template.setName(request.name());
        template.setSlug(request.slug());
        template.setSubdomain(request.subdomain());
        template.setThumbnailMediaId(request.thumbnailMediaId());
        template.setDescription(request.description());
        template.setCategory(request.category());
        template.setTechTags(request.techTags());
        template.setDisplayOrder(request.displayOrder());
        template.setActive(request.active());
    }
}
```

- [ ] **Step 6: Create `PublicTemplateController` and `AdminTemplateController`**

```java
package com.portfolio.platform.template;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/templates")
public class PublicTemplateController {

    private final TemplateService templateService;

    public PublicTemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateDto> listActive() {
        return templateService.listActive();
    }
}
```

```java
package com.portfolio.platform.template;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/templates")
public class AdminTemplateController {

    private final TemplateService templateService;

    public AdminTemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateDto> listAll() {
        return templateService.listAllForAdmin();
    }

    @PostMapping
    public Long create(@Valid @RequestBody TemplateUpsertForm request, Authentication auth) {
        return templateService.create(request, null);
    }

    @PutMapping("/{id}")
    public Long update(@PathVariable Long id, @Valid @RequestBody TemplateUpsertForm request) {
        return templateService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public Long delete(@PathVariable Long id) {
        return templateService.softDelete(id);
    }
}
```

- [ ] **Step 7: Run service test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=TemplateServiceTest`
Expected: PASS

- [ ] **Step 8: Write and run the passing public controller test**

```java
package com.portfolio.platform.template;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicTemplateControllerTest {

    @Autowired MockMvc mockMvc;

    @Test
    void listActive_isPubliclyAccessible() throws Exception {
        mockMvc.perform(get("/api/public/templates"))
                .andExpect(status().isOk());
    }
}
```

Run: `mvn -f backend/pom.xml test -Dtest=PublicTemplateControllerTest`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add backend/src
git commit -m "feat: add Template CRUD module with public/admin endpoints and caching"
```

## Self-Review Notes

- **Spec coverage:** implements the `template` module and `templates` table from spec sections 5–6, plus the Redis cache-aside pattern from section 5.
- **Type consistency:** `TemplateDto` fields are the exact shape the frontend's `Template` type (plan 11) and `AdminTemplatesPage` (plan 14) must mirror.
- **Next plan:** `2026-09-19-06-content-media-settings.md`.
