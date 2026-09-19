# Content Section, Media & Settings Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the content-section CMS, media upload, and settings modules so the company page content, images, and site config are DB-driven and admin-editable.

**Architecture:** Three small packages — `content`, `media`, `settings` — each following the same entity/repository/service/controller shape as `template` (plan 05), with content sections and settings cached and audited like templates.

**Tech Stack:** Spring Data JPA, Spring Cache + Redis, Spring MVC multipart upload, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-04-audit-error-logging.md` (needs `@Audited`); `2026-09-19-01-backend-scaffold.md` (needs `content_sections`, `media`, `settings` tables).

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

### Task: Content section, media, and settings modules

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/content/ContentSection.java`
- Create: `backend/src/main/java/com/portfolio/platform/content/ContentSectionRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/content/ContentSectionService.java`
- Create: `backend/src/main/java/com/portfolio/platform/content/ContentSectionController.java`
- Create: `backend/src/main/java/com/portfolio/platform/media/Media.java`
- Create: `backend/src/main/java/com/portfolio/platform/media/MediaRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/media/MediaService.java`
- Create: `backend/src/main/java/com/portfolio/platform/media/MediaController.java`
- Create: `backend/src/main/java/com/portfolio/platform/settings/Setting.java`
- Create: `backend/src/main/java/com/portfolio/platform/settings/SettingRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/settings/SettingsService.java`
- Create: `backend/src/main/java/com/portfolio/platform/settings/SettingsController.java`
- Test: `backend/src/test/java/com/portfolio/platform/content/ContentSectionServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/settings/SettingsServiceTest.java`

**Interfaces:**
- Consumes: `Audited` from plan 04.
- Produces: `GET /api/public/content-sections/{key}` → raw JSON string; `MediaService.store(MultipartFile, Long uploadedBy): Media` — consumed by plan 14's admin media picker; `SettingsService.get(String key): Optional<String>` — consumed by the frontend's SEO/meta rendering.

- [ ] **Step 1: Write the failing `ContentSectionService` test**

```java
package com.portfolio.platform.content;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentSectionServiceTest {

    @Mock ContentSectionRepository repository;
    @InjectMocks ContentSectionService service;

    @Test
    void getByKey_returnsDataJson() {
        ContentSection section = new ContentSection();
        section.setSectionKey("hero");
        section.setDataJson("{\"title\":\"Welcome\"}");
        when(repository.findBySectionKey("hero")).thenReturn(Optional.of(section));

        Optional<String> result = service.getByKey("hero");

        assertThat(result).contains("{\"title\":\"Welcome\"}");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionServiceTest`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Create `ContentSection` entity, repository, service, controller**

```java
package com.portfolio.platform.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "content_sections")
@Getter
@Setter
public class ContentSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key", nullable = false, unique = true)
    private String sectionKey;

    @Column(name = "data_json", nullable = false, columnDefinition = "jsonb")
    private String dataJson;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

```java
package com.portfolio.platform.content;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContentSectionRepository extends JpaRepository<ContentSection, Long> {
    Optional<ContentSection> findBySectionKey(String sectionKey);
}
```

```java
package com.portfolio.platform.content;

import com.portfolio.platform.audit.Audited;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class ContentSectionService {

    private final ContentSectionRepository repository;

    public ContentSectionService(ContentSectionRepository repository) {
        this.repository = repository;
    }

    @Cacheable("content-sections")
    @Transactional(readOnly = true)
    public Optional<String> getByKey(String sectionKey) {
        return repository.findBySectionKey(sectionKey).map(ContentSection::getDataJson);
    }

    @Audited(entityType = "ContentSection", action = "UPDATE")
    @CacheEvict(value = "content-sections", allEntries = true)
    @Transactional
    public Long upsert(String sectionKey, String dataJson, Long updatedBy) {
        ContentSection section = repository.findBySectionKey(sectionKey).orElseGet(() -> {
            ContentSection created = new ContentSection();
            created.setSectionKey(sectionKey);
            return created;
        });
        section.setDataJson(dataJson);
        section.setVersion(section.getVersion() + 1);
        section.setUpdatedBy(updatedBy);
        section.setUpdatedAt(Instant.now());
        return repository.save(section).getId();
    }
}
```

```java
package com.portfolio.platform.content;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ContentSectionController {

    private final ContentSectionService service;

    public ContentSectionController(ContentSectionService service) {
        this.service = service;
    }

    @GetMapping("/api/public/content-sections/{key}")
    public ResponseEntity<String> getByKey(@PathVariable("key") String key) {
        return service.getByKey(key)
                .map(json -> ResponseEntity.ok().body(json))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/admin/content-sections/{key}")
    public Long upsert(@PathVariable("key") String key, @RequestBody String dataJson) {
        return service.upsert(key, dataJson, null);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionServiceTest`
Expected: PASS

- [ ] **Step 5: Create `Media` entity, repository, service, controller (file stored on a local disk volume, path returned as URL)**

```java
package com.portfolio.platform.media;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "media")
@Getter
@Setter
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String url;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
```

```java
package com.portfolio.platform.media;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository extends JpaRepository<Media, Long> {
}
```

```java
package com.portfolio.platform.media;

import com.portfolio.platform.audit.Audited;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final Path uploadDir;

    public MediaService(MediaRepository mediaRepository, @Value("${media.upload-dir:/data/media}") String uploadDir) {
        this.mediaRepository = mediaRepository;
        this.uploadDir = Path.of(uploadDir);
    }

    @Audited(entityType = "Media", action = "CREATE")
    @Transactional
    public Media store(MultipartFile file, Long uploadedBy) throws IOException {
        Files.createDirectories(uploadDir);
        String storedName = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path target = uploadDir.resolve(storedName);
        file.transferTo(target);

        Media media = new Media();
        media.setFileName(file.getOriginalFilename());
        media.setUrl("/media/" + storedName);
        media.setMimeType(file.getContentType());
        media.setSizeBytes(file.getSize());
        media.setUploadedBy(uploadedBy);
        return mediaRepository.save(media);
    }
}
```

```java
package com.portfolio.platform.media;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping
    public Media upload(@RequestParam("file") MultipartFile file) throws IOException {
        return mediaService.store(file, null);
    }
}
```

- [ ] **Step 6: Write the failing `SettingsService` test**

```java
package com.portfolio.platform.settings;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock SettingRepository repository;
    @InjectMocks SettingsService service;

    @Test
    void get_returnsValueJsonForKnownKey() {
        Setting setting = new Setting();
        setting.setKey("site_title");
        setting.setValueJson("\"My Portfolio\"");
        when(repository.findByKey("site_title")).thenReturn(Optional.of(setting));

        assertThat(service.get("site_title")).contains("\"My Portfolio\"");
    }
}
```

- [ ] **Step 7: Run test to verify it fails, then create `Setting`, `SettingRepository`, `SettingsService`, `SettingsController`**

Run: `mvn -f backend/pom.xml test -Dtest=SettingsServiceTest`
Expected: FAIL

```java
package com.portfolio.platform.settings;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "settings")
@Getter
@Setter
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "key", nullable = false, unique = true)
    private String key;

    @Column(name = "value_json", nullable = false, columnDefinition = "jsonb")
    private String valueJson;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

```java
package com.portfolio.platform.settings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SettingRepository extends JpaRepository<Setting, Long> {
    Optional<Setting> findByKey(String key);
}
```

```java
package com.portfolio.platform.settings;

import com.portfolio.platform.audit.Audited;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class SettingsService {

    private final SettingRepository repository;

    public SettingsService(SettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<String> get(String key) {
        return repository.findByKey(key).map(Setting::getValueJson);
    }

    @Audited(entityType = "Setting", action = "UPDATE")
    @Transactional
    public void set(String key, String valueJson, Long updatedBy) {
        Setting setting = repository.findByKey(key).orElseGet(() -> {
            Setting created = new Setting();
            created.setKey(key);
            return created;
        });
        setting.setValueJson(valueJson);
        setting.setUpdatedBy(updatedBy);
        setting.setUpdatedAt(Instant.now());
        repository.save(setting);
    }
}
```

```java
package com.portfolio.platform.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping("/api/public/settings/{key}")
    public ResponseEntity<String> get(@PathVariable String key) {
        return service.get(key).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/admin/settings/{key}")
    public void set(@PathVariable String key, @RequestBody String valueJson) {
        service.set(key, valueJson, null);
    }
}
```

- [ ] **Step 8: Run all new tests to verify they pass**

Run: `mvn -f backend/pom.xml test -Dtest=ContentSectionServiceTest,SettingsServiceTest`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/portfolio/platform/content backend/src/main/java/com/portfolio/platform/media backend/src/main/java/com/portfolio/platform/settings backend/src/test/java/com/portfolio/platform/content backend/src/test/java/com/portfolio/platform/settings
git commit -m "feat: add content section, media upload, and settings modules"
```

## Self-Review Notes

- **Spec coverage:** implements the `content`, `media`, `settings` modules and their tables from spec sections 5–6.
- **Type consistency:** `Media.url` (`"/media/" + storedName`) must match the Nginx `location /media/` alias created in plan 16 exactly.
- **Next plan:** `2026-09-19-07-lead-notification.md`.
