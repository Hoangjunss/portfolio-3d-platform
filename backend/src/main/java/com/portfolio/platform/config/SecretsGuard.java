package com.portfolio.platform.config;

import jakarta.annotation.PostConstruct;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class SecretsGuard {

    private static final Map<String, String> DEV_DEFAULTS = Map.of(
            "jwt.access-secret", "dev-only-access-secret-change-me-32bytes",
            "analytics.ip-hash-secret", "dev-only-analytics-secret-change-me");

    private final Environment environment;

    public SecretsGuard(Environment environment) {
        this.environment = environment;
    }

    // A-08: both secrets have defaults that are published in this repository, and nothing failed
    // when the environment did not override them. The old failure mode was silent -- the app
    // booted happily and every analytics ip_hash was reversible by anyone who could read the repo.
    @PostConstruct
    public boolean verify() {
        if (!List.of(environment.getActiveProfiles()).contains("prod")) {
            return true;
        }
        DEV_DEFAULTS.forEach((key, devValue) -> {
            if (devValue.equals(environment.getProperty(key))) {
                throw new IllegalStateException(
                        "Refusing to start with the development default for " + key
                                + ". Set it via the environment before deploying.");
            }
        });
        return true;
    }
}
