package com.portfolio.platform.controller;

import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_returns400_whenEntityTypeMissing() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_returns400_whenEntityTypeBlank() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_cannotBeAskedForAnUnboundedPage() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .param("entityType", "Template")
                        .param("size", "100000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_filtersByEntityTypeOnly_whenEntityIdOmitted() throws Exception {
        AuditLog log1 = new AuditLog();
        log1.setEntityType("Template");
        log1.setAction("CREATE");
        log1.setEntityId(10L);
        log1.setCreatedAt(Instant.parse("2026-09-01T10:00:00Z"));
        auditLogRepository.save(log1);

        AuditLog log2 = new AuditLog();
        log2.setEntityType("User");
        log2.setAction("UPDATE");
        log2.setEntityId(20L);
        log2.setCreatedAt(Instant.parse("2026-09-02T10:00:00Z"));
        auditLogRepository.save(log2);

        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].entityType").value("Template"))
                .andExpect(jsonPath("$.content[0].action").value("CREATE"))
                .andExpect(jsonPath("$.content[0].entityId").value(10));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_filtersByEntityTypeAndEntityId_whenBothProvided() throws Exception {
        AuditLog log1 = new AuditLog();
        log1.setEntityType("Template");
        log1.setAction("CREATE");
        log1.setEntityId(10L);
        log1.setCreatedAt(Instant.parse("2026-09-01T10:00:00Z"));
        auditLogRepository.save(log1);

        AuditLog log2 = new AuditLog();
        log2.setEntityType("Template");
        log2.setAction("UPDATE");
        log2.setEntityId(20L);
        log2.setCreatedAt(Instant.parse("2026-09-02T10:00:00Z"));
        auditLogRepository.save(log2);

        mockMvc.perform(get("/api/admin/audit-logs")
                        .param("entityType", "Template")
                        .param("entityId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].entityId").value(10))
                .andExpect(jsonPath("$.content[0].action").value("CREATE"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_ordersByCreatedAtDescByDefault() throws Exception {
        AuditLog older = new AuditLog();
        older.setEntityType("Template");
        older.setAction("CREATE");
        older.setEntityId(1L);
        older.setCreatedAt(Instant.parse("2026-09-01T10:00:00Z"));
        auditLogRepository.save(older);

        AuditLog newer = new AuditLog();
        newer.setEntityType("Template");
        newer.setAction("UPDATE");
        newer.setEntityId(1L);
        newer.setCreatedAt(Instant.parse("2026-09-05T10:00:00Z"));
        auditLogRepository.save(newer);

        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].action").value("UPDATE"))
                .andExpect(jsonPath("$.content[1].action").value("CREATE"));
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void list_asEditor_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_isReadOnly_doesNotWriteAuditLog() throws Exception {
        long countBefore = auditLogRepository.count();

        mockMvc.perform(get("/api/admin/audit-logs").param("entityType", "Template"))
                .andExpect(status().isOk());

        assertThat(auditLogRepository.count()).isEqualTo(countBefore);
    }
}
