package com.portfolio.platform.config;

import com.portfolio.platform.form.LoginForm;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ErrorDispatchSecurityTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void validationFailureOnLogin_returns400() {
        LoginForm invalid = new LoginForm("", "");
        ResponseEntity<String> response = restTemplate.postForEntity("/api/auth/login", invalid, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("VALIDATION_FAILED");
    }

    @Test
    void unmappedPublicEndpoint_returns500() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/public/nope", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).contains("INTERNAL_ERROR");
    }
}
