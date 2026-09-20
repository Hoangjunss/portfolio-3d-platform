package com.portfolio.platform.filter;

import com.portfolio.platform.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RateLimitForwardedIpTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @Test
    void twoDifferentForwardedIpsDoNotShareABucket() throws Exception {
        // /api/public/leads allows 5 per hour. Exhaust one IP completely...
        for (int i = 0; i < 5; i++) {
            postLead("203.0.113.10").andExpect(status().isAccepted());
        }
        postLead("203.0.113.10").andExpect(status().isTooManyRequests());

        // ...the other must be untouched. Without forward-headers-strategy both requests carry
        // the same getRemoteAddr() and this line returns 429.
        postLead("203.0.113.99").andExpect(status().isAccepted());
    }

    private ResultActions postLead(String forwardedIp) throws Exception {
        return mockMvc.perform(post("/api/public/leads")
                .header("X-Forwarded-For", forwardedIp)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test User\",\"email\":\"test@example.com\",\"message\":\"Hello\"}"));
    }
}
