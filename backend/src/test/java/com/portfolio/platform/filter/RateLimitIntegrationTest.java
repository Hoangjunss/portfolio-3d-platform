package com.portfolio.platform.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "rate-limit.paths.[/api/public/leads].capacity=5",
        "rate-limit.paths.[/api/public/leads].window=1h",
        "rate-limit.paths.[/api/analytics/events].capacity=120",
        "rate-limit.paths.[/api/analytics/events].window=1m",
        "rate-limit.paths.[/api/auth/login].capacity=10",
        "rate-limit.paths.[/api/auth/login].window=15m"
})
class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @MockBean
    private NotificationService notificationService;

    @Test
    void publicLeads_isRateLimitedAfterFiveRequestsAndDoesNotWriteErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        LeadCreateForm form = new LeadCreateForm(
                "Jane Doe",
                "jane@example.com",
                "0123456789",
                "Testing rate limiting",
                null
        );

        String json = objectMapper.writeValueAsString(form);

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/public/leads")
                            .with(req -> {
                                req.setRemoteAddr("198.51.100.42");
                                return req;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isAccepted());
        }

        // 6th request from the same IP must be 429
        mockMvc.perform(post("/api/public/leads")
                        .with(req -> {
                            req.setRemoteAddr("198.51.100.42");
                            return req;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(jsonPath("$.message").value("Too many requests"));

        // Critical: A 429 must not write a system_error_logs row
        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    void unlistedEndpoint_isNeverRateLimited() throws Exception {
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(get("/api/public/templates")
                            .with(req -> {
                                req.setRemoteAddr("198.51.100.99");
                                return req;
                            }))
                    .andExpect(status().isOk());
        }
    }
}
