package com.portfolio.platform.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void summary_asEditor_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/analytics/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalViews").isNumber())
                .andExpect(jsonPath("$.totalClicks").isNumber())
                .andExpect(jsonPath("$.topTemplates").isArray());
    }

    @Test
    void summary_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/analytics/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
