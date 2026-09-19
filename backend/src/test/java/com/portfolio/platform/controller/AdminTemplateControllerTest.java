package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        templateRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void create_asAdmin_writesAuditLogRow() throws Exception {
        User admin = userRepository.findByUsername("admin_user").orElseGet(() -> {
            User u = new User();
            u.setUsername("admin_user");
            u.setEmail("admin_user@portfolio.com");
            u.setPasswordHash("hashed");
            u.setRole(Role.ADMIN);
            return userRepository.save(u);
        });

        long auditCountBefore = auditLogRepository.count();

        TemplateUpsertForm form = new TemplateUpsertForm(
                "Admin Template",
                "admin-tpl",
                "admin-sub",
                null,
                "Admin Description",
                "Portfolio",
                "Next.js, Three.js",
                1,
                true
        );

        MvcResult result = mockMvc.perform(post("/api/admin/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isOk())
                .andReturn();

        Long returnedId = Long.valueOf(result.getResponse().getContentAsString());
        assertThat(returnedId).isNotNull();

        assertThat(auditLogRepository.count()).isEqualTo(auditCountBefore + 1);

        AuditLog auditLog = auditLogRepository.findAll().stream()
                .filter(log -> "Template".equals(log.getEntityType()) && returnedId.equals(log.getEntityId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected audit log for Template with id " + returnedId));

        assertThat(auditLog.getAction()).isEqualTo("CREATE");
        assertThat(auditLog.getEntityId()).isEqualTo(returnedId);
        assertThat(auditLog.getUserId()).isEqualTo(admin.getId());

        var createdTemplate = templateRepository.findById(returnedId).orElseThrow();
        assertThat(createdTemplate.getCreatedBy()).isEqualTo(admin.getId());
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void create_asEditor_isAllowed() throws Exception {
        TemplateUpsertForm form = new TemplateUpsertForm(
                "Editor Template",
                "editor-tpl",
                "editor-sub",
                null,
                "Editor Description",
                "Portfolio",
                "Next.js",
                2,
                true
        );

        mockMvc.perform(post("/api/admin/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isOk());
    }

    @Test
    void create_unauthenticated_returns401() throws Exception {
        TemplateUpsertForm form = new TemplateUpsertForm(
                "Anon Template",
                "anon-tpl",
                "anon-sub",
                null,
                "Anon Description",
                "Portfolio",
                "Next.js",
                3,
                true
        );

        mockMvc.perform(post("/api/admin/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
