package com.portfolio.platform.service;

import com.portfolio.platform.dto.RotationDto;

import java.util.Optional;

public interface RefreshTokenService {

    String issue(Long userId);

    Optional<RotationDto> rotate(String rawToken);

    void revoke(String rawToken);

    int purgeExpired();
}
