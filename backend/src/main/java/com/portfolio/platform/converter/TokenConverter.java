package com.portfolio.platform.converter;

import com.portfolio.platform.dto.TokenDto;

public interface TokenConverter {

    TokenDto toDto(String accessToken, String refreshToken);
}
