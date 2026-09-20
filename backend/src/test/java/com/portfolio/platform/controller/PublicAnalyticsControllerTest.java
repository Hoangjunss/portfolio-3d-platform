package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.AnalyticsEventType;
import com.portfolio.platform.model.AnalyticsEvent;
import com.portfolio.platform.model.Template;
import com.portfolio.platform.repository.AnalyticsEventRepository;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.repository.TemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AnalyticsEventRepository analyticsEventRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @BeforeEach
    void setUp() {
        analyticsEventRepository.deleteAll();
    }

    @Test
    void track_unauthenticated_returns202AndPersistsEvent() throws Exception {
        Template template = new Template();
        template.setName("Test Template");
        template.setSlug("test-template-" + System.currentTimeMillis());
        template.setSubdomain("test-" + System.currentTimeMillis());
        Template savedTemplate = templateRepository.save(template);

        Map<String, Object> body = Map.of(
                "eventType", "PAGE_VIEW",
                "templateId", savedTemplate.getId(),
                "sessionId", "session-123"
        );

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .header("User-Agent", "TestBrowser/1.0")
                        .header("Referer", "https://portfolio.com")
                        .header("X-Forwarded-For", "203.0.113.195, 70.41.3.18"))
                .andExpect(status().isAccepted());

        List<AnalyticsEvent> events = analyticsEventRepository.findAll();
        assertThat(events).hasSize(1);
        AnalyticsEvent event = events.get(0);
        assertThat(event.getEventType()).isEqualTo(AnalyticsEventType.PAGE_VIEW);
        assertThat(event.getTemplateId()).isEqualTo(savedTemplate.getId());
        assertThat(event.getSessionId()).isEqualTo("session-123");
        assertThat(event.getUserAgent()).isEqualTo("TestBrowser/1.0");
        assertThat(event.getReferrer()).isEqualTo("https://portfolio.com");
        assertThat(event.getIpHash()).isNotBlank();
        assertThat(event.getIpHash()).isNotEqualTo("203.0.113.195");
    }

    @Test
    void track_withUnknownEventType_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        Map<String, Object> body = Map.of(
                "eventType", "UNKNOWN_CUSTOM_TYPE",
                "sessionId", "session-123"
        );

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    void track_withBlankSessionId_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        Map<String, Object> body = Map.of(
                "eventType", "PAGE_VIEW",
                "sessionId", "   "
        );

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }
}
