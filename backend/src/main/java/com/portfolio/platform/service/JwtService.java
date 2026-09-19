package com.portfolio.platform.service;

import com.portfolio.platform.enums.Role;
import com.portfolio.platform.model.User;

import java.util.Optional;

public interface JwtService {

    record Claims(String username, Role role) {
    }

    String generateAccessToken(User user);

    Optional<Claims> validateAccessToken(String token);
}
