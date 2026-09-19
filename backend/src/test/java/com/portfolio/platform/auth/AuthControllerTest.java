package com.portfolio.platform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.user.Role;
import com.portfolio.platform.user.User;
import com.portfolio.platform.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

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
}
