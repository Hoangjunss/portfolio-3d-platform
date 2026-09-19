package com.portfolio.platform.dto;

import com.portfolio.platform.model.User;

public record RotationDto(User user, String rawRefreshToken) {
}
