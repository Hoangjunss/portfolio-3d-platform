package com.portfolio.platform.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.repository.SystemErrorLogRepository;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

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

        @GetMapping("/api/test/invalid-request")
        public void invalidRequest() {
            throw new InvalidRequestException("Invalid field value");
        }

        @GetMapping("/api/test/upload-too-large")
        public void uploadTooLarge() {
            throw new MaxUploadSizeExceededException(10485760L);
        }

        @PostMapping("/api/test/echo")
        public EchoRequest echo(@org.springframework.web.bind.annotation.RequestBody EchoRequest request) {
            return request;
        }

        @GetMapping("/api/test/echo/{id}")
        public Long echoPath(@org.springframework.web.bind.annotation.PathVariable Long id) {
            return id;
        }
    }

    record EchoRequest(Long id) {}

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

    @Test
    @WithMockUser
    void invalidRequestException_returns400AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/test/invalid-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Invalid field value"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void maxUploadSizeExceededException_returns413AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/test/upload-too-large"))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"))
                .andExpect(jsonPath("$.message").value("File size exceeds maximum limit"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void malformedJson_returns400AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(post("/api/test/echo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"a\": BROKEN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.message").value("Malformed request body"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void wrongFieldType_returns400AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(post("/api/test/echo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"not-a-number\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.message").value("Malformed request body"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void wrongPathVariableType_returns400AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/test/echo/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void wrongHttpMethod_returns405AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(get("/api/test/echo"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser
    void wrongContentType_returns415AndDoesNotLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(post("/api/test/echo")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("hello"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }

    @Test
    void malformedJsonOnPublicEndpoint_returns400AndWritesNoErrorLog() throws Exception {
        long before = systemErrorLogRepository.count();

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\", BROKEN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(before);
    }
}
