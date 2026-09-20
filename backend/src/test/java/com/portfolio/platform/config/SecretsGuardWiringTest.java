package com.portfolio.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SecretsGuardWiringTest {

    @Autowired(required = false)
    private SecretsGuard secretsGuard;

    // SecretsGuardTest calls verify() directly, so it stays green even if the class is no longer
    // a bean. Without this test, deleting one annotation silently reopens A-08 and lets a deploy
    // run on the development secret that is committed to this repository.
    @Test
    void theGuardIsRegisteredAsABeanSoItRunsAtStartup() {
        assertThat(secretsGuard)
                .as("SecretsGuard must be a Spring bean, or its @PostConstruct check never runs")
                .isNotNull();
    }
}
