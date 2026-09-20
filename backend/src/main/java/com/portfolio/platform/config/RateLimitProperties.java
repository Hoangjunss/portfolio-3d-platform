package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

    public record LimitSpec(int capacity, Duration window) {}

    private Map<String, LimitSpec> paths = new HashMap<>();

    public Map<String, LimitSpec> getPaths() {
        return paths;
    }

    public void setPaths(Map<String, LimitSpec> paths) {
        this.paths = paths;
    }

    public LimitSpec getLimitSpec(String servletPath) {
        if (servletPath == null || paths == null) {
            return null;
        }
        String normalized = servletPath.length() > 1 && servletPath.endsWith("/")
                ? servletPath.substring(0, servletPath.length() - 1)
                : servletPath;
        // No "[path]" fallback: Spring's relaxed binding already strips the brackets the YAML
        // keys need, so the bracketed lookup never fired. Measured by deleting it — the
        // integration test, which reads the real application.yml, stayed green.
        return paths.get(normalized);
    }
}
