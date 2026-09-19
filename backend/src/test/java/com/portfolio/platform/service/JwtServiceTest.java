package com.portfolio.platform.service;

import com.portfolio.platform.config.JwtProperties;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.model.User;
import com.portfolio.platform.service.impl.JwtServiceImpl;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private final JwtProperties props = new JwtProperties(
            "test-access-secret-must-be-32-bytes-min", 15, 7);
    private final JwtService jwtService = new JwtServiceImpl(props);

    @Test
    void generateAndValidateAccessToken_roundTrips() {
        User user = new User();
        user.setUsername("admin");
        user.setRole(Role.ADMIN);

        String token = jwtService.generateAccessToken(user);
        var claims = jwtService.validateAccessToken(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().username()).isEqualTo("admin");
        assertThat(claims.get().role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void validateAccessToken_rejectsGarbage() {
        assertThat(jwtService.validateAccessToken("not-a-jwt")).isEmpty();
    }
}
