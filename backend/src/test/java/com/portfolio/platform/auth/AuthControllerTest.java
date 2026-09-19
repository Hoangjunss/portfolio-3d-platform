package com.portfolio.platform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.user.Role;
import com.portfolio.platform.user.User;
import com.portfolio.platform.user.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired ObjectMapper objectMapper;
    @Autowired EntityManager entityManager;

    @Test
    void login_doesNotChangeUpdatedAt() throws Exception {
        User user = new User();
        user.setUsername("touchy");
        user.setEmail("touchy@portfolio.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        userRepository.saveAndFlush(user);
        entityManager.clear();

        Instant originalUpdatedAt = userRepository.findByUsername("touchy").orElseThrow().getUpdatedAt();
        Instant beforeLogin = Instant.now();

        Thread.sleep(10);

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("touchy", "secret123"))))
                .andExpect(status().isOk());

        entityManager.clear();

        User reloaded = userRepository.findByUsername("touchy").orElseThrow();
        assertThat(reloaded.getLastLoginAt()).isNotNull().isAfter(beforeLogin);
        assertThat(reloaded.getUpdatedAt()).isEqualTo(originalUpdatedAt);
    }

    @Test
    void login_withValidCredentials_returns200AndTokens() throws Exception {
        User user = new User();
        user.setUsername("admin");
        user.setEmail("admin@portfolio.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "secret123"))))
                .andExpect(status().isOk());
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        User user = new User();
        user.setUsername("admin2");
        user.setEmail("admin2@portfolio.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin2", "wrong"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_withValidToken_returnsNewAccessAndRefreshTokens() throws Exception {
        TokenResponse issued = login("refresher");

        TokenResponse rotated = refreshExpectingOk(issued.refreshToken());

        assertThat(rotated.accessToken()).isNotBlank();
        assertThat(rotated.refreshToken()).isNotBlank();
        assertThat(rotated.refreshToken()).isNotEqualTo(issued.refreshToken());
    }

    @Test
    void refresh_withAlreadyRotatedToken_returns401() throws Exception {
        TokenResponse issued = login("replayer");
        refreshExpectingOk(issued.refreshToken());

        refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_withReplayedToken_killsTheWholeFamily() throws Exception {
        TokenResponse tokenA = login("victim");
        TokenResponse tokenB = refreshExpectingOk(tokenA.refreshToken());

        refresh(tokenA.refreshToken()).andExpect(status().isUnauthorized());

        refresh(tokenB.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_withUnknownToken_returns401() throws Exception {
        refresh("not-a-real-token").andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_afterLogout_returns401() throws Exception {
        TokenResponse issued = login("quitter");

        mockMvc.perform(post("/api/auth/logout")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshRequest(issued.refreshToken()))))
                .andExpect(status().isNoContent());

        refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_afterUserDeactivated_returns401() throws Exception {
        TokenResponse issued = login("deactivated");

        User user = userRepository.findByUsername("deactivated").orElseThrow();
        user.setActive(false);
        userRepository.saveAndFlush(user);

        refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void login_withValidCredentials_recordsLastLoginAt() throws Exception {
        login("stamped");

        var user = userRepository.findByUsername("stamped").orElseThrow();
        assertThat(user.getLastLoginAt()).isNotNull();
    }

    private TokenResponse login(String username) throws Exception {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@portfolio.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, "secret123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, TokenResponse.class);
    }

    private org.springframework.test.web.servlet.ResultActions refresh(String refreshToken) throws Exception {
        return mockMvc.perform(post("/api/auth/refresh")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new RefreshRequest(refreshToken))));
    }

    private TokenResponse refreshExpectingOk(String refreshToken) throws Exception {
        String body = refresh(refreshToken)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, TokenResponse.class);
    }
}
