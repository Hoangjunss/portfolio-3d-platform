package com.portfolio.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecretsGuardTest {

    @Test
    void refusesToStartWhenTheJwtSecretStillHoldsItsDevelopmentDefault() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("jwt.access-secret", "dev-only-access-secret-change-me-32bytes");
        env.setProperty("analytics.ip-hash-secret", "a-real-secret");

        assertThatThrownBy(() -> new SecretsGuard(env).verify())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("jwt.access-secret");
    }

    @Test
    void refusesToStartWhenTheAnalyticsSecretStillHoldsItsDevelopmentDefault() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("jwt.access-secret", "a-real-secret");
        env.setProperty("analytics.ip-hash-secret", "dev-only-analytics-secret-change-me");

        assertThatThrownBy(() -> new SecretsGuard(env).verify())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("analytics.ip-hash-secret");
    }

    @Test
    void allowsDevelopmentDefaultsWhenTheProdProfileIsNotActive() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("jwt.access-secret", "dev-only-access-secret-change-me-32bytes");
        env.setProperty("analytics.ip-hash-secret", "dev-only-analytics-secret-change-me");

        assertThat(new SecretsGuard(env).verify()).isTrue();
    }

    @Test
    void startsWhenBothSecretsAreReal() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("jwt.access-secret", "a-real-secret");
        env.setProperty("analytics.ip-hash-secret", "another-real-secret");

        assertThat(new SecretsGuard(env).verify()).isTrue();
    }
}
