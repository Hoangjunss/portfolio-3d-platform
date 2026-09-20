package com.portfolio.platform.dto;

import com.portfolio.platform.enums.Role;

import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String email,
        Role role,
        boolean active,
        Instant lastLoginAt,
        Instant createdAt,
        Instant updatedAt
) {
}
