# Lead Capture & Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revised:** 2026-09-20 — rewritten before hand-off. The previous draft still used
`package com.portfolio.platform.lead;` (pre-spec-5.1 feature packages) in every code block, and
carried none of the three open findings from the plan 06 review. Both are fixed here.

**Goal:** Two things, in this order.
1. Close the three open findings from `docs/reviews/2026-09-20-code-review-plan-06.md` (C-01,
   C-02, C-03) so commit `e99ae9e` can be pushed.
2. Let visitors submit a contact/quote form that is persisted as a lead and triggers an email
   notification.

**Architecture:** Layered per spec 5.1 — `model/Lead`, `enums/LeadStatus`,
`repository/LeadRepository`, `form/LeadCreateForm`, `service/LeadService` +
`service/impl/LeadServiceImpl`, `controller/PublicLeadController`, plus a
`service/NotificationService` seam for email.

**Tech Stack:** Spring Mail (`JavaMailSender`, `spring-boot-starter-mail` already in `pom.xml`),
Spring Data JPA, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-04-audit-error-logging.md` (needs `@Audited`);
`2026-09-19-01-backend-scaffold.md` (needs the `leads` table — it exists in `V1__init_schema.sql`
lines 60–72, do **not** write a new migration);
`2026-09-19-06-content-media-settings.md` (task 1 edits code that plan delivered).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- **Nothing below 5xx may write a `system_error_logs` row.** This is the constraint C-01 broke and
  R-01 broke before it. Any new exception type MUST get an explicit `@ExceptionHandler` in the
  same commit that introduces it — never leave it to the `Exception.class` catch-all.
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5). **Rate limiting itself is plan 09** — do not add Bucket4j here.
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
- **Constructor injection only** (spec 5.1). No field `@Autowired`.
- Spring Boot here is **3.3.4** — the test mock annotation is
  `org.springframework.boot.test.mock.mockito.MockBean`, not `@MockitoBean` (3.4+).

---

## Task 1: Close plan-06 review findings (C-01, C-02, C-03)

Source: `docs/reviews/2026-09-20-code-review-plan-06.md`. Do this task **first and commit it
separately** — it is a fix for already-written code, and mixing it into the lead commit makes
both unreviewable.

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/exception/InvalidRequestException.java`
- Modify: `backend/src/main/java/com/portfolio/platform/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/portfolio/platform/service/impl/MediaServiceImpl.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/java/com/portfolio/platform/service/MediaServiceTest.java`
- Modify: `backend/src/test/java/com/portfolio/platform/controller/MediaControllerTest.java`
- Modify: `backend/src/test/java/com/portfolio/platform/exception/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Produces: `InvalidRequestException` — the project's single typed "the caller sent something
  we refuse" exception, mapped to `400 VALIDATION_FAILED` with **no** `system_error_logs` row.
  Every later plan that needs to reject caller input reuses this instead of inventing a new
  unmapped type.

### Design decisions this task must follow

**(a) Why `InvalidRequestException` and not a global map of `IllegalArgumentException`.**
The review suggested `InvalidUploadException`. Use the broader name: `IllegalArgumentException`
is thrown by Spring, Hibernate and the JDK, so mapping *that* type to 400 globally would turn a
genuine internal bug into a silent 400 — the review says this explicitly. One typed exception
owned by us, used by upload today and by lead validation in task 2, is the fix for the repeating
pattern. Message text is safe to echo back because we author every message (same reasoning as
finding T-03).

**(b) The `SecurityException` traversal guard stays a 500 — on purpose.**
The review grouped it with the 400s. Do not change it, and record this in the commit body: the
stored filename is `UUID + extension-derived-from-sniffed-type`, so no caller input reaches
`target`. If `startsWith` ever fails it means `media.upload-dir` is misconfigured — a server
fault, which is exactly what deserves a 500 and a `system_error_logs` row. Only
caller-controllable rejections become `InvalidRequestException`.

**(c) The multipart limit gap (new, found while revising this plan).**
`application.yml` sets `media.max-size-bytes: 10485760` but never sets
`spring.servlet.multipart.max-file-size`, whose Boot default is **1MB**. So today the app-level
10MB check is unreachable dead code above 1MB, and a 2MB PNG dies in multipart parsing with
`MaxUploadSizeExceededException` → catch-all → **500 + a `system_error_logs` row**. Same bug
class as C-01, live right now. Fix both halves: raise the multipart limits to match, and add a
handler so the limit is a 413, not a 500.

- [ ] **Step 1: Write the failing tests**

`MediaServiceTest` — four changes:

1. Rename `store_withSpoofedContentType_usesSniffedType` to
   `store_withSvgContentDeclaredAsPng_isRejected` (C-02: the old name promised something the
   body never checked) and change its expected type to `InvalidRequestException`.
2. Change the expected type in `store_withDisallowedType_isRejected` to
   `InvalidRequestException`.
3. Add the case C-02 says was never covered — a **real PNG** declaring `text/html`:

```java
    @Test
    void store_withRealPngDeclaredAsTextHtml_persistsSniffedMimeType(@TempDir Path tempDir) {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(10L);
            return m;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file", "innocent.png", "text/html", VALID_PNG_BYTES);

        mediaService.store(file, "admin");

        ArgumentCaptor<Media> captor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository).save(captor.capture());
        assertThat(captor.getValue().getMimeType()).isEqualTo("image/png");
        assertThat(captor.getValue().getUrl()).endsWith(".png");
    }
```

4. Add the C-03 case. `MockMultipartFile` is byte-array backed so `read(byte[])` always fills the
   array and the bug is invisible — the test needs a stream that deliberately returns short
   reads. Add a nested helper in the test file:

```java
    /** A MultipartFile whose stream returns at most 4 bytes per read — what a file- or
     *  network-backed multipart is allowed to do, and what MockMultipartFile never does. */
    private record DripFedMultipartFile(byte[] content) implements MultipartFile {
        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return "drip.webp"; }
        @Override public String getContentType() { return "image/webp"; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content; }
        @Override public InputStream getInputStream() {
            return new FilterInputStream(new ByteArrayInputStream(content)) {
                @Override public int read(byte[] b, int off, int len) throws IOException {
                    return super.read(b, off, Math.min(len, 4));
                }
            };
        }
        @Override public void transferTo(java.io.File dest) { throw new UnsupportedOperationException(); }
    }

    @Test
    void store_whenStreamReturnsShortReads_stillDetectsWebp(@TempDir Path tempDir) {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(11L);
            return m;
        });

        mediaService.store(new DripFedMultipartFile(VALID_WEBP_BYTES), "admin");

        ArgumentCaptor<Media> captor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository).save(captor.capture());
        assertThat(captor.getValue().getMimeType()).isEqualTo("image/webp");
    }
```

   with the constant:

```java
    private static final byte[] VALID_WEBP_BYTES = new byte[]{
            'R', 'I', 'F', 'F', 0x1A, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P',
            'V', 'P', '8', ' ', 0x0E, 0x00, 0x00, 0x00
    };
```

`MediaControllerTest` — add the HTTP-layer case C-01 says was missing. The four security tests
all live at service level and assert exception types, so none of them ever showed what a client
actually receives. Autowire `SystemErrorLogRepository` and assert the count does not move:

```java
    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void upload_withDisallowedType_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        MockMultipartFile evil = new MockMultipartFile(
                "file", "evil.html", "text/html",
                "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/admin/media").file(evil))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }
```

`GlobalExceptionHandlerTest` — the multipart-limit path cannot be exercised through MockMvc
(MockMvc hands the controller an already-parsed `MockMultipartFile`, so the container's size
check never runs). Test the handler directly instead, using the `BoomController` pattern that is
already in this file. Add two endpoints to it — one throwing `InvalidRequestException`, one
throwing `MaxUploadSizeExceededException` — and assert status plus an unchanged
`system_error_logs` count for both (400 and 413 respectively).

- [ ] **Step 2: Run tests to verify they fail**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test -Dtest='MediaServiceTest+MediaControllerTest+GlobalExceptionHandlerTest'
```

Expected: FAIL — `InvalidRequestException` does not exist; the sniffed-type and short-read cases
fail; the controller case gets 500 instead of 400.

- [ ] **Step 3: Create `InvalidRequestException` and wire the handlers**

```java
package com.portfolio.platform.exception;

public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
```

In `GlobalExceptionHandler`, add both handlers **above** the `Exception.class` catch-all:

```java
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorDto> handleInvalidRequest(InvalidRequestException ex) {
        // 400 is the caller's fault, not a system fault — no system_error_logs row.
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("VALIDATION_FAILED", ex.getMessage(), null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorDto> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
        // Thrown by multipart parsing before the controller runs; still the caller's fault, so
        // it must not write a system_error_logs row either.
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiErrorDto("FILE_TOO_LARGE", "File size exceeds maximum limit", null));
    }
```

- [ ] **Step 4: Fix `MediaServiceImpl` (C-01 throw sites + C-03 short read)**

- Replace all four `throw new IllegalArgumentException(...)` in `store` — empty file, size over
  limit, content too short, disallowed type — with `InvalidRequestException`, keeping the same
  messages. Also replace the one in `extensionForMimeType`'s `default ->` branch.
- Leave `throw new SecurityException("Path traversal attempt detected")` **unchanged**, and add
  the one-line WHY from decision (b) above it.
- Replace the header read with `readNBytes`:

```java
        byte[] header;
        try (InputStream in = file.getInputStream()) {
            // readNBytes, not read(byte[]): a single read() on a file- or network-backed stream
            // may return fewer bytes than asked even when more are available, which would make a
            // valid 12-byte WEBP signature undetectable.
            header = in.readNBytes(12);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (header.length < 3) {
            throw new InvalidRequestException("File content is too short");
        }
```

  Note `detectMimeType` already guards every branch with a `header.length >=` check, so a short
  array stays safe.

- [ ] **Step 5: Raise the multipart limits to match the app-level limit**

In `backend/src/main/resources/application.yml`, under `spring:`:

```yaml
  servlet:
    multipart:
      # Must stay >= media.max-size-bytes, otherwise MediaServiceImpl's own size check is
      # unreachable and the real limit surfaces as a multipart parse failure instead.
      max-file-size: 10MB
      max-request-size: 11MB
```

- [ ] **Step 6: Run the full suite**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

Expected: PASS. Baseline before this task is 58 tests; expect roughly **64** (+3 MediaServiceTest,
+1 MediaControllerTest, +2 GlobalExceptionHandlerTest; one test is renamed, not added). Recount
and report the real number — do not copy this one if it differs.

- [ ] **Step 7: Mutation checks — run them, do not assume**

Revert each change one at a time, run the named test, confirm RED, restore. Report the actual
result of each; if one stays GREEN, say so instead of hiding it.

| # | Revert | Test that must go RED |
|---|---|---|
| M1 | `media.setMimeType(detectedMimeType)` → `media.setMimeType(file.getContentType())` | `MediaServiceTest` (this is the mutation C-02 was found by — target the **write** branch, not the check branch) |
| M2 | `in.readNBytes(12)` → `in.read(header)` | `MediaServiceTest#store_whenStreamReturnsShortReads_stillDetectsWebp` |
| M3 | delete the `InvalidRequestException` handler | `MediaControllerTest#upload_withDisallowedType_returns400AndWritesNoErrorLog` |
| M4 | delete the `MaxUploadSizeExceededException` handler | `GlobalExceptionHandlerTest` |

- [ ] **Step 8: Commit**

```bash
git add backend/src backend/src/main/resources/application.yml
git commit -m "fix: return 400 for rejected uploads and detect media type from short reads"
```

The commit body must record: decision (b) (why the traversal guard stays a 500), the multipart
limit gap from (c), and the real test count before/after.

---

## Task 2: Lead module + email notification

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/enums/LeadStatus.java`
- Create: `backend/src/main/java/com/portfolio/platform/model/Lead.java`
- Create: `backend/src/main/java/com/portfolio/platform/repository/LeadRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/form/LeadCreateForm.java`
- Create: `backend/src/main/java/com/portfolio/platform/config/NotificationProperties.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/NotificationService.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/impl/NotificationServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/LeadService.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/impl/LeadServiceImpl.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/PublicLeadController.java`
- Modify: `backend/src/main/resources/application.yml` (notification recipient/from)
- Test: `backend/src/test/java/com/portfolio/platform/service/LeadServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/NotificationServiceTest.java`
- Test: `backend/src/test/java/com/portfolio/platform/controller/PublicLeadControllerTest.java`

**Interfaces:**
- Consumes: `Audited` (plan 04), `InvalidRequestException` (task 1), `TemplateRepository` (plan 05).
- Produces: `POST /api/public/leads` → `202 Accepted`, empty body;
  `NotificationService.notifyNewLead(Lead)` — a best-effort seam other channels (Slack, webhook)
  can implement later; `LeadRepository` — plan 14 extends it with an admin list method.

### Design decisions this task must follow

**(d) Email failure must not lose the lead.** The naive version calls `mailSender.send` inside
the `@Transactional` submit, so an SMTP outage rolls the lead back and the visitor's enquiry is
gone — the worst possible failure for the one endpoint that makes the site money. `notifyNewLead`
is therefore **best-effort and never throws**: `NotificationServiceImpl` catches `MailException`
and logs it. That contract is what `NotificationServiceTest` pins.

**(e) Bound every field to its column.** `leads.name`/`email` are `VARCHAR(255)`, `phone` is
`VARCHAR(32)`. Without `@Size` on the form, a 300-character name reaches the database and comes
back as a constraint violation → catch-all → 500 + a `system_error_logs` row from an anonymous
public endpoint. That is C-01's bug class on an unauthenticated route, which is strictly worse.
`message` is `TEXT` but still gets `@Size(max = 5000)` — the process runs in 350MB (spec 7).

**(f) `sourceTemplateId` is a real FK** (`REFERENCES templates(id)`). An unknown id would
surface as a `DataIntegrityViolationException` → 500 + log row. Validate it in the service with
`templateRepository.existsById` and throw `InvalidRequestException` — this is the reuse task 1's
exception was created for.

**(h) Carry finding D-02 from the task 1 review.** `spring.servlet.multipart.max-file-size` and
`media.max-size-bytes` must move together — raising one without the other silently brings back
the 500 + `system_error_logs` bug that task 1 fixed, and no existing test can see it (MockMvc
never runs multipart parsing). Add
`backend/src/test/java/com/portfolio/platform/config/MultipartLimitTest.java`: a `@SpringBootTest`
that injects `MediaStorageProperties` and `@Value("${spring.servlet.multipart.max-file-size}") DataSize`,
and asserts `maxFileSize.toBytes() >= mediaStorageProperties.getMaxSizeBytes()`. Three lines, and
it pins the pairing the YAML comment currently only states in prose.

**(g) Audit the public submit.** `@Audited(entityType = "Lead", action = "CREATE")` on
`submit`. `AuditAspect` already resolves an anonymous caller to `userId = null` and
`audit_logs.user_id` is nullable, so the row records the IP with no user — which is the useful
part for a public form. `submit` must return `Long` or the aspect cannot fill `entity_id`.

- [ ] **Step 1: Write the failing tests**

`LeadServiceTest` (`@ExtendWith(MockitoExtension.class)`, mocks `LeadRepository`,
`TemplateRepository`, `NotificationService`, `@InjectMocks LeadServiceImpl`):

```java
    @Test
    void submit_savesLeadWithNewStatusAndNotifies() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", "0900000000", "Hi", null);
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> {
            Lead l = inv.getArgument(0);
            l.setId(7L);
            return l;
        });

        Long id = leadService.submit(form);

        assertThat(id).isEqualTo(7L);
        ArgumentCaptor<Lead> captor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(LeadStatus.NEW);
        verify(notificationService).notifyNewLead(captor.getValue());
        verifyNoInteractions(templateRepository);
    }

    @Test
    void submit_withUnknownSourceTemplateId_isRejected() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", null, null, 999L);
        when(templateRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> leadService.submit(form))
                .isInstanceOf(InvalidRequestException.class);

        verify(leadRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }
```

`NotificationServiceTest` (mocks `JavaMailSender`, real `NotificationProperties` as `@Spy`):

```java
    @Test
    void notifyNewLead_sendsMailToConfiguredRecipient() { /* ArgumentCaptor<SimpleMailMessage>:
        assert getTo() is the configured recipient, subject contains the lead name, text contains
        the lead email */ }

    @Test
    void notifyNewLead_whenMailSenderThrows_doesNotPropagate() {
        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(SimpleMailMessage.class));
        assertThatCode(() -> notificationService.notifyNewLead(lead)).doesNotThrowAnyException();
    }
```

`PublicLeadControllerTest` (`@SpringBootTest`, `@AutoConfigureMockMvc`,
`@ActiveProfiles("test")`, `@MockBean NotificationService` so no test ever opens an SMTP socket;
autowire `LeadRepository`, `AuditLogRepository`, `SystemErrorLogRepository`):

```java
    @Test
    void submit_unauthenticated_returns202AndPersistsLeadWithAuditRow() { /* no @WithMockUser:
        /api/public/** is permitAll. Assert 202, the lead row exists with status NEW, and an
        audit_logs row for entityType "Lead" with a null userId. */ }

    @Test
    void submit_withBlankName_returns400AndWritesNoErrorLog() { /* assert 400,
        code VALIDATION_FAILED, and systemErrorLogRepository.count() unchanged */ }

    @Test
    void submit_withOverlongName_returns400AndWritesNoErrorLog() { /* 300-char name — decision
        (e). Same assertions. This is the one that proves @Size is doing the work rather than
        the database. */ }
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test -Dtest='LeadServiceTest+NotificationServiceTest+PublicLeadControllerTest'
```

Expected: FAIL — classes do not exist.

- [ ] **Step 3: Create `LeadStatus`, `Lead`, `LeadRepository`, `LeadCreateForm`**

```java
package com.portfolio.platform.enums;

public enum LeadStatus {
    NEW, CONTACTED, CLOSED
}
```

```java
package com.portfolio.platform.model;

import com.portfolio.platform.enums.LeadStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "leads")
@Getter
@Setter
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "source_template_id")
    private Long sourceTemplateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "internal_note", columnDefinition = "text")
    private String internalNote;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

`source_template_id` is mapped as a plain `Long`, not a `@ManyToOne Template` — matching how
`Media.uploadedBy` and `AuditLog.userId` are already done in this codebase, and keeping `model`
free of a lazy-loading association the public endpoint would never use.

```java
package com.portfolio.platform.repository;

import com.portfolio.platform.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadRepository extends JpaRepository<Lead, Long> {
}
```

```java
package com.portfolio.platform.form;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LeadCreateForm(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 32) String phone,
        @Size(max = 5000) String message,
        Long sourceTemplateId) {
}
```

- [ ] **Step 4: Create `NotificationProperties`, `NotificationService` (+Impl)**

```java
package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notification")
public class NotificationProperties {

    private String leadRecipient = "sales@portfolio.com";
    private String from = "no-reply@portfolio.com";

    // getters + setters
}
```

`@ConfigurationPropertiesScan` is already on the application class — no
`@EnableConfigurationProperties` needed.

```java
package com.portfolio.platform.service;

import com.portfolio.platform.model.Lead;

public interface NotificationService {

    /** Best-effort: a delivery failure is logged, never thrown — a lost email must not lose the lead. */
    void notifyNewLead(Lead lead);
}
```

`NotificationServiceImpl` builds a `SimpleMailMessage` (from, to, subject `"New lead: " + name`,
body with email/phone/message), calls `mailSender.send`, and wraps that call in
`catch (MailException e)` that logs at ERROR with the lead id. Nothing else.

Add to `application.yml`:

```yaml
notification:
  lead-recipient: ${LEAD_RECIPIENT_EMAIL:sales@portfolio.com}
  from: ${MAIL_FROM:no-reply@portfolio.com}
```

- [ ] **Step 5: Create `LeadService` (+Impl) and `PublicLeadController`**

```java
package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.enums.LeadStatus;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.LeadService;
import com.portfolio.platform.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadServiceImpl implements LeadService {

    private final LeadRepository leadRepository;
    private final TemplateRepository templateRepository;
    private final NotificationService notificationService;

    public LeadServiceImpl(LeadRepository leadRepository,
                           TemplateRepository templateRepository,
                           NotificationService notificationService) {
        this.leadRepository = leadRepository;
        this.templateRepository = templateRepository;
        this.notificationService = notificationService;
    }

    @Audited(entityType = "Lead", action = "CREATE")
    @Transactional
    @Override
    public Long submit(LeadCreateForm form) {
        if (form.sourceTemplateId() != null && !templateRepository.existsById(form.sourceTemplateId())) {
            // Checked here rather than left to the FK: a violation would surface as a 500 and a
            // system_error_logs row written by an anonymous caller.
            throw new InvalidRequestException("Unknown source template");
        }

        Lead lead = new Lead();
        lead.setName(form.name());
        lead.setEmail(form.email());
        lead.setPhone(form.phone());
        lead.setMessage(form.message());
        lead.setSourceTemplateId(form.sourceTemplateId());
        lead.setStatus(LeadStatus.NEW);

        Lead saved = leadRepository.save(lead);
        notificationService.notifyNewLead(saved);
        return saved.getId();
    }
}
```

```java
package com.portfolio.platform.controller;

import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/leads")
public class PublicLeadController {

    private final LeadService leadService;

    public PublicLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    // 202 with no body: the caller gets no lead id back, because the endpoint is unauthenticated.
    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody LeadCreateForm form) {
        leadService.submit(form);
        return ResponseEntity.accepted().build();
    }
}
```

`/api/public/**` is already `permitAll()` in `SecurityConfig` line 45 — **no SecurityConfig
change is needed**. Do not touch that file.

- [ ] **Step 6: Run the full suite**

```bash
export JAVA_HOME="C:/Program Files/Java/jdk-21.0.11"
mvn -f backend/pom.xml test
```

Expected: PASS, and `LayerDependencyTest` still green (every import above is inside the
allow-list: `service` → `repository`/`model`/`enums`/`form`/`exception`/`annotation`,
`controller` → `service`/`form`). Report the real test count.

- [ ] **Step 7: Mutation checks — run them, do not assume**

| # | Revert | Test that must go RED |
|---|---|---|
| M5 | drop `lead.setStatus(LeadStatus.NEW)` | `LeadServiceTest#submit_savesLeadWithNewStatusAndNotifies` |
| M6 | drop the `notificationService.notifyNewLead(saved)` call | same test |
| M7 | remove the `catch (MailException e)` in `NotificationServiceImpl` | `NotificationServiceTest#notifyNewLead_whenMailSenderThrows_doesNotPropagate` |
| M8 | hardcode the recipient instead of reading `NotificationProperties` | `NotificationServiceTest#notifyNewLead_sendsMailToConfiguredRecipient` |
| M9 | drop the `existsById` guard | `LeadServiceTest#submit_withUnknownSourceTemplateId_isRejected` |
| M10 | drop `@Valid` on the controller parameter | `PublicLeadControllerTest#submit_withBlankName_returns400AndWritesNoErrorLog` |
| M11 | drop `@Size(max = 255)` from `LeadCreateForm.name` | `PublicLeadControllerTest#submit_withOverlongName_returns400AndWritesNoErrorLog` |

M11 is the one most likely to stay GREEN — H2 with `ddl-auto: create-drop` may not enforce the
length the way Postgres does. If it stays green, **say so**; the finding is then that the test
proves nothing and the guard is only as good as the annotation.

- [ ] **Step 8: Commit**

```bash
git add backend/src backend/src/main/resources/application.yml
git commit -m "feat: add lead capture module with best-effort new-lead email notification"
```

The commit body must record decisions (d), (f) and (g), and the M11 result honestly.

---

## Self-Review Notes

- **Spec coverage:** implements the `lead` and `notification` modules and the `leads` table from
  spec sections 5–6, in the spec 5.1 layered package tree.
- **Type consistency:** `LeadStatus.NEW/CONTACTED/CLOSED` are the exact values plan 14's admin
  leads screen must render and filter on. `Lead.internalNote` / `Lead.assignedTo` are mapped but
  unwritten here — plan 14 owns them.
- **Not in this plan:** rate limiting on `POST /api/public/leads` (plan 09) and the admin leads
  list/update screens (plan 14). A `LeadDto` and `LeadConverter` are deliberately **not** created
  here — nothing returns a lead yet, and an unused converter is dead code plan 14 would rewrite.
- **Carried forward to plan 14:** finding C-04 — `media.file_name`, and now also `leads.name` /
  `leads.message`, are attacker-authored strings. Any admin screen rendering them must escape.
- **Next plan:** `2026-09-19-08-analytics.md` — which must also decide finding T-02
  (`view_count` is in the schema, the entity and `TemplateDto` but nothing writes it).
