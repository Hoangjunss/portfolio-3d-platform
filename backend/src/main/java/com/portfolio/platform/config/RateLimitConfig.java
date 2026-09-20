package com.portfolio.platform.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.filter.RateLimitFilter;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitProperties properties, ObjectMapper objectMapper) {
        RateLimitFilter filter = new RateLimitFilter(properties, objectMapper);
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.addUrlPatterns("/*");
        // Registered after Spring Security's chain (SecurityProperties.DEFAULT_FILTER_ORDER = -100).
        // This ordering means a flood still walks the security chain first;
        // moving the filter earlier is a deliberate change, not a cleanup.
        registration.setOrder(SecurityProperties.DEFAULT_FILTER_ORDER + 1);
        return registration;
    }
}
