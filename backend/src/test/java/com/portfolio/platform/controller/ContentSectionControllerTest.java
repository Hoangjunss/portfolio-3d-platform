package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.form.ContentSectionUpsertForm;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.ContentSection;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.ContentSectionRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContentSectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContentSectionRepository contentSectionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        contentSectionRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listAllContentSections_returns200WithArray() throws Exception {
        ContentSection section = new ContentSection();
        section.setSectionKey("hero");
        section.setDataJson("{\"headline\":\"See your site before you build it.\"}");
        section.setVersion(1);
        contentSectionRepository.save(section);

        mockMvc.perform(get("/api/admin/content-sections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].sectionKey").value("hero"))
                .andExpect(jsonPath("$[0].dataJson").value("{\"headline\":\"See your site before you build it.\"}"))
                .andExpect(jsonPath("$[0].version").value(1));
    }

    @Test
    void listAllContentSections_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/content-sections"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getByKey_public_returnsSeededSection() throws Exception {
        ContentSection section = new ContentSection();
        section.setSectionKey("hero");
        section.setDataJson("{\"title\":\"Welcome\"}");
        section.setVersion(1);
        contentSectionRepository.save(section);

        mockMvc.perform(get("/api/public/content-sections/hero"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionKey").value("hero"))
                .andExpect(jsonPath("$.dataJson").value("{\"title\":\"Welcome\"}"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void getByKey_public_unknownKey_returns404NotFound() throws Exception {
        mockMvc.perform(get("/api/public/content-sections/unknown_key"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void upsert_asEditor_succeedsAndWritesAuditLogRow() throws Exception {
        User editor = userRepository.findByUsername("editor_user").orElseGet(() -> {
            User u = new User();
            u.setUsername("editor_user");
            u.setEmail("editor_user@portfolio.com");
            u.setPasswordHash("hashed");
            u.setRole(Role.EDITOR);
            return userRepository.save(u);
        });

        long auditCountBefore = auditLogRepository.count();

        ContentSectionUpsertForm form = new ContentSectionUpsertForm("{\"headline\":\"Updated\"}");

        MvcResult result = mockMvc.perform(put("/api/admin/content-sections/features")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isOk())
                .andReturn();

        Long returnedId = Long.valueOf(result.getResponse().getContentAsString());
        assertThat(returnedId).isNotNull();

        assertThat(auditLogRepository.count()).isEqualTo(auditCountBefore + 1);

        AuditLog auditLog = auditLogRepository.findAll().stream()
                .filter(log -> "ContentSection".equals(log.getEntityType()) && returnedId.equals(log.getEntityId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected audit log for ContentSection with id " + returnedId));

        assertThat(auditLog.getEntityId()).isEqualTo(returnedId);
        assertThat(auditLog.getUserId()).isEqualTo(editor.getId());

        ContentSection saved = contentSectionRepository.findById(returnedId).orElseThrow();
        assertThat(saved.getUpdatedBy()).isEqualTo(editor.getId());
        assertThat(saved.getDataJson()).isEqualTo("{\"headline\":\"Updated\"}");
    }

    @Test
    void upsert_unauthenticated_returns401() throws Exception {
        ContentSectionUpsertForm form = new ContentSectionUpsertForm("{\"headline\":\"Unauthorized\"}");

        mockMvc.perform(put("/api/admin/content-sections/features")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isUnauthorized());
    }
}
