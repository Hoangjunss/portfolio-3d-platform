package com.portfolio.platform.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenCleanupJobTest {

    @Autowired RefreshTokenRepository refreshTokenRepository;

    // The job itself is @Profile("!test") so the cron never fires during tests; the delete
    // logic is exercised by driving the component directly.
    @Test
    void purgeExpiredTokens_deletesOnlyExpiredRows() {
        RefreshToken expired = save("expired-hash", Instant.now().minus(1, ChronoUnit.DAYS), false);
        RefreshToken revokedButLive = save("revoked-hash", Instant.now().plus(1, ChronoUnit.DAYS), true);
        RefreshToken live = save("live-hash", Instant.now().plus(1, ChronoUnit.DAYS), false);

        new RefreshTokenCleanupJob(refreshTokenRepository).purgeExpiredTokens();

        assertThat(refreshTokenRepository.findById(expired.getId())).isEmpty();
        assertThat(refreshTokenRepository.findById(revokedButLive.getId())).isPresent();
        assertThat(refreshTokenRepository.findById(live.getId())).isPresent();
    }

    private RefreshToken save(String tokenHash, Instant expiresAt, boolean revoked) {
        RefreshToken token = new RefreshToken();
        token.setUserId(1L);
        token.setTokenHash(tokenHash);
        token.setExpiresAt(expiresAt);
        token.setRevoked(revoked);
        return refreshTokenRepository.save(token);
    }
}
