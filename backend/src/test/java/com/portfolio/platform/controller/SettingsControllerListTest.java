package com.portfolio.platform.controller;

import com.portfolio.platform.constant.SettingKeys;
import com.portfolio.platform.model.Setting;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.SettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SettingsControllerListTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void setUp() {
        settingRepository.deleteAll();
        auditLogRepository.deleteAll();
    }

    @Test
    void listSettings_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void listSettings_asEditor_returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void listSettings_asAdmin_returnsAllExistingRows() throws Exception {
        Setting siteTitle = new Setting();
        siteTitle.setKey(SettingKeys.SITE_TITLE);
        siteTitle.setValueJson("\"Portfolio 3D\"");
        settingRepository.save(siteTitle);

        Setting contactEmail = new Setting();
        contactEmail.setKey(SettingKeys.CONTACT_EMAIL);
        contactEmail.setValueJson("\"contact@portfolio.com\"");
        settingRepository.save(contactEmail);

        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.key == '" + SettingKeys.SITE_TITLE + "')].valueJson").value("\"Portfolio 3D\""))
                .andExpect(jsonPath("$[?(@.key == '" + SettingKeys.CONTACT_EMAIL + "')].valueJson").value("\"contact@portfolio.com\""));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void listSettings_returnsEmptyList_whenNoSettingsExist() throws Exception {
        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void listSettings_isReadOnly_doesNotWriteAuditLog() throws Exception {
        long countBefore = auditLogRepository.count();

        mockMvc.perform(get("/api/admin/settings"))
                .andExpect(status().isOk());

        assertThat(auditLogRepository.count()).isEqualTo(countBefore);
    }
}
