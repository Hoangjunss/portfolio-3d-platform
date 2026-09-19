package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.TokenConverter;
import com.portfolio.platform.dto.TokenDto;
import org.springframework.stereotype.Component;

@Component
public class TokenConverterImpl implements TokenConverter {

    @Override
    public TokenDto toDto(String accessToken, String refreshToken) {
        return new TokenDto(accessToken, refreshToken);
    }
}
