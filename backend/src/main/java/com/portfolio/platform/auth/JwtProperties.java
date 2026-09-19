package com.portfolio.platform.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String accessSecret,
        long accessTtlMinutes,
        long refreshTtlDays) {
}
