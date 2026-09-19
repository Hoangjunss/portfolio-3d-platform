# Backend Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Spring Boot backend project (Maven, Java 21) with PostgreSQL + Flyway wired in, and the full database schema created via a baseline migration.

**Architecture:** A single Spring Boot module (`backend/`) that boots against Postgres, applying `V1__init_schema.sql` via Flyway on startup. This is the foundation every later backend task (02-10) builds on.

**Tech Stack:** Java 21, Spring Boot 3.3.4, Maven, PostgreSQL 16, Flyway, Lombok, JUnit 5 + Testcontainers.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md`

**Depends on:** none (first plan in the sequence).

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

### Task: Backend project scaffold + Postgres + Flyway wiring

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/portfolio/platform/PortfolioPlatformApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-test.yml`
- Create: `backend/src/test/java/com/portfolio/platform/PortfolioPlatformApplicationTests.java`
- Create: `backend/src/main/resources/db/migration/V1__init_schema.sql`

**Interfaces:**
- Produces: Spring Boot app bootable on port `8080`, Flyway auto-runs migrations on startup, `spring.profiles.active=test` uses an in-memory-friendly test DB config (Testcontainers configured in plan 02 for repository tests).

- [ ] **Step 1: Create `pom.xml` with core dependencies**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.4</version>
    <relativePath/>
  </parent>
  <groupId>com.portfolio.platform</groupId>
  <artifactId>portfolio-platform</artifactId>
  <version>0.1.0</version>
  <properties>
    <java.version>21</java.version>
  </properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-cache</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-mail</artifactId></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-core</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-database-postgresql</artifactId></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.6</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>com.bucket4j</groupId><artifactId>bucket4j_jdk17-core</artifactId><version>8.10.1</version></dependency>
    <dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.springframework.security</groupId><artifactId>spring-security-test</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.testcontainers</groupId><artifactId>postgresql</artifactId><scope>test</scope></dependency>
    <dependency><groupId>org.testcontainers</groupId><artifactId>junit-jupiter</artifactId><scope>test</scope></dependency>
    <dependency><groupId>com.h2database</groupId><artifactId>h2</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>
```

- [ ] **Step 2: Create the application entry point**

```java
package com.portfolio.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class PortfolioPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortfolioPlatformApplication.class, args);
    }
}
```

- [ ] **Step 3: Create `application.yml`**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:portfolio}
    username: ${DB_USER:portfolio}
    password: ${DB_PASSWORD:portfolio}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
  mail:
    host: ${SMTP_HOST:localhost}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USER:}
    password: ${SMTP_PASSWORD:}
  flyway:
    locations: classpath:db/migration

jwt:
  access-secret: ${JWT_ACCESS_SECRET:dev-only-access-secret-change-me-32bytes}
  refresh-secret: ${JWT_REFRESH_SECRET:dev-only-refresh-secret-change-me-32b}
  access-ttl-minutes: 15
  refresh-ttl-days: 7
```

- [ ] **Step 4: Create `application-test.yml` (H2 for fast unit/slice tests)**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:portfolio;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
```

- [ ] **Step 5: Write the smoke test**

```java
package com.portfolio.platform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PortfolioPlatformApplicationTests {
    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 6: Run the test to verify it passes (empty context, nothing to validate yet)**

Run: `mvn -f backend/pom.xml test`
Expected: PASS — confirms the scaffold itself boots before any domain code is added.

- [ ] **Step 7: Create the initial Flyway migration with the full schema from spec section 6**

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    subdomain VARCHAR(128) NOT NULL UNIQUE,
    thumbnail_media_id BIGINT REFERENCES media(id),
    description TEXT,
    category VARCHAR(128),
    tech_tags VARCHAR(512),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    view_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

CREATE TABLE content_sections (
    id BIGSERIAL PRIMARY KEY,
    section_key VARCHAR(64) NOT NULL UNIQUE,
    data_json JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    message TEXT,
    source_template_id BIGINT REFERENCES templates(id),
    status VARCHAR(16) NOT NULL DEFAULT 'NEW',
    internal_note TEXT,
    assigned_to BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL,
    template_id BIGINT REFERENCES templates(id),
    session_id VARCHAR(128) NOT NULL,
    ip_hash VARCHAR(128) NOT NULL,
    user_agent VARCHAR(512),
    referrer VARCHAR(1024),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(16) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id BIGINT,
    old_value_json JSONB,
    new_value_json JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE system_error_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    http_status INT NOT NULL,
    exception_class VARCHAR(255) NOT NULL,
    message TEXT,
    stacktrace TEXT,
    request_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(128) NOT NULL UNIQUE,
    value_json JSONB NOT NULL,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_template_created ON analytics_events(template_id, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_leads_status ON leads(status);
```

- [ ] **Step 8: Run the app against a real Postgres to verify the migration applies**

Run: `docker run --rm -d --name pg-test -e POSTGRES_DB=portfolio -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -p 5432:5432 postgres:16-alpine && mvn -f backend/pom.xml spring-boot:run`
Expected: startup log shows `Flyway ... Successfully applied 1 migration`, app stays up on port 8080. Stop with `docker stop pg-test`.

- [ ] **Step 9: Commit**

```bash
git add backend/pom.xml backend/src
git commit -m "feat: scaffold Spring Boot backend with Flyway baseline schema"
```

## Self-Review Notes

- **Spec coverage:** spec section 6 (full DB schema) is created verbatim in `V1__init_schema.sql`; spec section 7's `-Xmx350m` constraint is not yet enforced here (that's Docker packaging, plan 15) but is recorded as a Global Constraint for every later plan.
- **Type consistency:** table/column names here are the single source of truth every entity in plans 02–10 must match exactly (e.g. `users.password_hash`, `templates.deleted_at`).
- **Next plan:** `2026-09-19-02-user-entity-repository.md`.
