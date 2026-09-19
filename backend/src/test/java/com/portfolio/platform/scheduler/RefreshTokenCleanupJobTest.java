package com.portfolio.platform.scheduler;

import com.portfolio.platform.model.RefreshToken;
import com.portfolio.platform.repository.RefreshTokenRepository;
import com.portfolio.platform.service.RefreshTokenService;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
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
    @Autowired RefreshTokenService refreshTokenService;
    @Autowired EntityManagerFactory entityManagerFactory;

    @Test
    void purgeExpiredTokens_usesBulkDelete() {
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        RefreshToken expired1 = save("expired-bulk-1", Instant.now().minus(1, ChronoUnit.DAYS), false);
        RefreshToken expired2 = save("expired-bulk-2", Instant.now().minus(2, ChronoUnit.DAYS), false);
        RefreshToken expired3 = save("expired-bulk-3", Instant.now().minus(3, ChronoUnit.DAYS), false);

        new RefreshTokenCleanupJob(refreshTokenService).purgeExpiredTokens();

        assertThat(stats.getEntityDeleteCount()).isEqualTo(0);
        assertThat(refreshTokenRepository.findById(expired1.getId())).isEmpty();
        assertThat(refreshTokenRepository.findById(expired2.getId())).isEmpty();
        assertThat(refreshTokenRepository.findById(expired3.getId())).isEmpty();
    }

    // The job itself is @Profile("!test") so the cron never fires during tests; the delete
    // logic is exercised by driving the component directly.
    @Test
    void purgeExpiredTokens_deletesOnlyExpiredRows() {
        RefreshToken expired = save("expired-hash", Instant.now().minus(1, ChronoUnit.DAYS), false);
        RefreshToken revokedButLive = save("revoked-hash", Instant.now().plus(1, ChronoUnit.DAYS), true);
        RefreshToken live = save("live-hash", Instant.now().plus(1, ChronoUnit.DAYS), false);

        new RefreshTokenCleanupJob(refreshTokenService).purgeExpiredTokens();

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
