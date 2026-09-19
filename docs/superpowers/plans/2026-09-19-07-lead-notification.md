# Lead Capture & Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors submit a contact/quote form that is persisted as a lead and triggers an email notification.

**Architecture:** A `com.portfolio.platform.lead` package (entity/repository/service/controller) plus a `com.portfolio.platform.notification.NotificationService` seam for email.

**Tech Stack:** Spring Mail (`JavaMailSender`), Spring Data JPA, JUnit 5 + Mockito.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** `2026-09-19-04-audit-error-logging.md` (needs `@Audited`); `2026-09-19-01-backend-scaffold.md` (needs `leads` table).

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

### Task: Lead module + email notification

**Files:**
- Create: `backend/src/main/java/com/portfolio/platform/model/Lead.java`
- Create: `backend/src/main/java/com/portfolio/platform/enums/LeadStatus.java`
- Create: `backend/src/main/java/com/portfolio/platform/repository/LeadRepository.java`
- Create: `backend/src/main/java/com/portfolio/platform/form/LeadCreateForm.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/LeadService.java`
- Create: `backend/src/main/java/com/portfolio/platform/controller/LeadController.java`
- Create: `backend/src/main/java/com/portfolio/platform/service/NotificationService.java`
- Test: `backend/src/test/java/com/portfolio/platform/service/LeadServiceTest.java`

**Interfaces:**
- Consumes: `Audited` from plan 04.
- Produces: `POST /api/public/leads` → `202 Accepted`; `NotificationService.notifyNewLead(Lead): void` — a seam other notification channels could later implement against; `LeadRepository` — extended in plan 14 with an admin list method.

- [ ] **Step 1: Write the failing `LeadService` test**

```java
package com.portfolio.platform.lead;

import com.portfolio.platform.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadServiceTest {

    @Mock LeadRepository leadRepository;
    @Mock NotificationService notificationService;
    @InjectMocks LeadService leadService;

    @Test
    void submit_savesLeadWithNewStatusAndNotifies() {
        LeadCreateForm request = new LeadCreateForm("Jane", "jane@example.com", "0900000000", "Hi", null);
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        leadService.submit(request);

        ArgumentCaptor<Lead> captor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(LeadStatus.NEW);
        verify(notificationService).notifyNewLead(captor.getValue());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -f backend/pom.xml test -Dtest=LeadServiceTest`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Create `LeadStatus`, `Lead`, `LeadRepository`, `LeadCreateForm`**

```java
package com.portfolio.platform.lead;

public enum LeadStatus {
    NEW, CONTACTED, CLOSED
}
```

```java
package com.portfolio.platform.lead;

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

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

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

```java
package com.portfolio.platform.lead;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadRepository extends JpaRepository<Lead, Long> {
}
```

```java
package com.portfolio.platform.lead;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LeadCreateForm(
        @NotBlank String name, @Email @NotBlank String email, String phone,
        String message, Long sourceTemplateId) {
}
```

- [ ] **Step 4: Create `NotificationService`, `LeadService`, `LeadController`**

```java
package com.portfolio.platform.notification;

import com.portfolio.platform.lead.Lead;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final JavaMailSender mailSender;

    public NotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void notifyNewLead(Lead lead) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("sales@portfolio.com");
        message.setSubject("New lead: " + lead.getName());
        message.setText("Email: " + lead.getEmail() + "\nMessage: " + lead.getMessage());
        mailSender.send(message);
    }
}
```

```java
package com.portfolio.platform.lead;

import com.portfolio.platform.audit.Audited;
import com.portfolio.platform.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    public LeadService(LeadRepository leadRepository, NotificationService notificationService) {
        this.leadRepository = leadRepository;
        this.notificationService = notificationService;
    }

    @Audited(entityType = "Lead", action = "CREATE")
    @Transactional
    public Long submit(LeadCreateForm request) {
        Lead lead = new Lead();
        lead.setName(request.name());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setMessage(request.message());
        lead.setSourceTemplateId(request.sourceTemplateId());
        lead.setStatus(LeadStatus.NEW);
        Lead saved = leadRepository.save(lead);
        notificationService.notifyNewLead(saved);
        return saved.getId();
    }
}
```

```java
package com.portfolio.platform.lead;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody LeadCreateForm request) {
        leadService.submit(request);
        return ResponseEntity.accepted().build();
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `mvn -f backend/pom.xml test -Dtest=LeadServiceTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat: add lead capture module with new-lead email notification"
```

## Self-Review Notes

- **Spec coverage:** implements the `lead` and `notification` modules and the `leads` table from spec sections 5–6.
- **Type consistency:** `LeadStatus.NEW/CONTACTED/CLOSED` are the exact values plan 14's admin leads screen must render/filter on.
- **Next plan:** `2026-09-19-08-analytics.md`.
