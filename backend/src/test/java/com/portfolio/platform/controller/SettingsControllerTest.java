package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.form.SettingUpsertForm;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.Setting;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.SettingRepository;
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
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        settingRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void set_asAdmin_succeedsAndWritesAuditLogRow() throws Exception {
        User admin = userRepository.findByUsername("admin_user").orElseGet(() -> {
            User u = new User();
            u.setUsername("admin_user");
            u.setEmail("admin_user@portfolio.com");
            u.setPasswordHash("hashed");
            u.setRole(Role.ADMIN);
            return userRepository.save(u);
        });

        long auditCountBefore = auditLogRepository.count();

        SettingUpsertForm form = new SettingUpsertForm("\"Custom Portfolio Title\"");

        MvcResult result = mockMvc.perform(put("/api/admin/settings/site_title")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isOk())
                .andReturn();

        Long returnedId = Long.valueOf(result.getResponse().getContentAsString());
        assertThat(returnedId).isNotNull();

        assertThat(auditLogRepository.count()).isEqualTo(auditCountBefore + 1);

        AuditLog auditLog = auditLogRepository.findAll().stream()
                .filter(log -> "Setting".equals(log.getEntityType()) && returnedId.equals(log.getEntityId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected audit log for Setting with id " + returnedId));

        assertThat(auditLog.getUserId()).isEqualTo(admin.getId());

        Setting saved = settingRepository.findById(returnedId).orElseThrow();
        assertThat(saved.getKey()).isEqualTo("site_title");
        assertThat(saved.getValueJson()).isEqualTo("\"Custom Portfolio Title\"");
        assertThat(saved.getUpdatedBy()).isEqualTo(admin.getId());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void get_asAdmin_returnsSetting() throws Exception {
        Setting setting = new Setting();
        setting.setKey("site_title");
        setting.setValueJson("\"Current Title\"");
        settingRepository.save(setting);

        mockMvc.perform(get("/api/admin/settings/site_title"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("site_title"))
                .andExpect(jsonPath("$.valueJson").value("\"Current Title\""));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void get_unknownKey_returns404() throws Exception {
        mockMvc.perform(get("/api/admin/settings/nonexistent_key"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @WithMockUser(roles = "EDITOR")
    void set_asEditor_returns403Forbidden() throws Exception {
        SettingUpsertForm form = new SettingUpsertForm("\"Editor Title\"");

        mockMvc.perform(put("/api/admin/settings/site_title")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isForbidden());
    }

    @Test
    void set_unauthenticated_returns401() throws Exception {
        SettingUpsertForm form = new SettingUpsertForm("\"Unauth Title\"");

        mockMvc.perform(put("/api/admin/settings/site_title")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isUnauthorized());
    }
}
