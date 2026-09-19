package com.portfolio.platform.error;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.audit.SystemErrorLogRepository;
import com.portfolio.platform.dto.ApiErrorDto;
import com.portfolio.platform.model.SystemErrorLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GlobalExceptionHandlerTest {

    @TestConfiguration
    static class TestConfig {
        @Bean
        BoomController boomController() {
            return new BoomController();
        }
    }

    @RestController
    static class BoomController {
        @GetMapping("/api/test/boom")
        public void boom() {
            throw new RuntimeException("Boom!");
        }

        @GetMapping("/api/test/denied")
        public void denied() {
            throw new AccessDeniedException("Access denied!");
        }
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private SystemErrorLogRepository systemErrorLogRepository;

    @Test
    @WithMockUser
    void unexpectedException_returns500AndPersistsErrorLog() throws Exception {
        long before = systemErrorLogRepository.count();

        String responseBody = mockMvc.perform(get("/api/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("Something went wrong"))
                .andExpect(jsonPath("$.requestId").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        assertThat(systemErrorLogRepository.count()).isEqualTo(before + 1);

        ApiErrorDto error = objectMapper.readValue(responseBody, ApiErrorDto.class);
        assertThat(error.requestId()).isNotBlank();

        SystemErrorLog lastLog = systemErrorLogRepository.findAll().get((int) before);
        assertThat(lastLog.getEndpoint()).isEqualTo("/api/test/boom");
        assertThat(lastLog.getHttpStatus()).isEqualTo(500);
        assertThat(lastLog.getExceptionClass()).isEqualTo(RuntimeException.class.getName());
        assertThat(lastLog.getRequestId()).isEqualTo(error.requestId());
    }

    @Test
    @WithMockUser
    void accessDeniedException_returns403AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/test/denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    void validationException_returns400AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"secret\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    void unauthenticatedAdminRequest_returns401WithApiErrorAndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/admin/anything"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").isNotEmpty());

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }
}
