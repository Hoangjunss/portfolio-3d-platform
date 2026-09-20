package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "auth")
public record AuthProperties(
        @DefaultValue("5") int maxRefreshTokensPerUser
) {
}
