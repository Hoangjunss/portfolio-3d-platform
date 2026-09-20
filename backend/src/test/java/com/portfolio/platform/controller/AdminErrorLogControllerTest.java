package com.portfolio.platform.controller;

import com.portfolio.platform.model.SystemErrorLog;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.SystemErrorLogRepository;
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
class AdminErrorLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        systemErrorLogRepository.deleteAll();
        auditLogRepository.deleteAll();
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/error-logs"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_cannotBeAskedForAnUnboundedPage() throws Exception {
        mockMvc.perform(get("/api/admin/error-logs").param("size", "100000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_isReadOnly_doesNotWriteSystemErrorLog() throws Exception {
        long errorLogCountBefore = systemErrorLogRepository.count();
        long auditLogCountBefore = auditLogRepository.count();

        mockMvc.perform(get("/api/admin/error-logs"))
                .andExpect(status().isOk());

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogCountBefore);
        assertThat(auditLogRepository.count()).isEqualTo(auditLogCountBefore);
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_returnsPagedNewestFirst_withFullStackTrace() throws Exception {
        SystemErrorLog older = new SystemErrorLog();
        older.setEndpoint("/api/admin/templates");
        older.setHttpStatus(500);
        older.setExceptionClass("java.lang.IllegalArgumentException");
        older.setMessage("older error message");
        older.setStacktrace("java.lang.IllegalArgumentException: older error\n\tat com.portfolio.OldClass.method(OldClass.java:10)");
        older.setRequestId("req-older");
        older.setCreatedAt(Instant.parse("2026-09-01T10:00:00Z"));
        systemErrorLogRepository.save(older);

        SystemErrorLog newer = new SystemErrorLog();
        newer.setEndpoint("/api/admin/leads");
        newer.setHttpStatus(500);
        newer.setExceptionClass("java.lang.NullPointerException");
        newer.setMessage("newer error message");
        newer.setStacktrace("java.lang.NullPointerException: newer error\n\tat com.portfolio.NewClass.method(NewClass.java:20)");
        newer.setRequestId("req-newer");
        newer.setCreatedAt(Instant.parse("2026-09-02T10:00:00Z"));
        systemErrorLogRepository.save(newer);

        mockMvc.perform(get("/api/admin/error-logs?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].id").value(newer.getId()))
                .andExpect(jsonPath("$.content[0].endpoint").value("/api/admin/leads"))
                .andExpect(jsonPath("$.content[0].httpStatus").value(500))
                .andExpect(jsonPath("$.content[0].exceptionClass").value("java.lang.NullPointerException"))
                .andExpect(jsonPath("$.content[0].message").value("newer error message"))
                .andExpect(jsonPath("$.content[0].stacktrace").value(newer.getStacktrace()))
                .andExpect(jsonPath("$.content[0].requestId").value("req-newer"))
                .andExpect(jsonPath("$.content[1].id").value(older.getId()))
                .andExpect(jsonPath("$.content[1].endpoint").value("/api/admin/templates"))
                .andExpect(jsonPath("$.content[1].stacktrace").value(older.getStacktrace()));
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void list_asEditor_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/error-logs"))
                .andExpect(status().isOk());
    }
}
