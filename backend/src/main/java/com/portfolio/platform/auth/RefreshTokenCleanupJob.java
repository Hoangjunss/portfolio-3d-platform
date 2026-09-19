package com.portfolio.platform.auth;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@Profile("!test")
public class RefreshTokenCleanupJob {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenCleanupJob(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // Revoked-but-unexpired rows are kept on purpose: they are what makes a replayed
    // refresh token fail instead of silently looking unknown.
    @Scheduled(cron = "0 30 3 * * *")
    public void purgeExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }
}
