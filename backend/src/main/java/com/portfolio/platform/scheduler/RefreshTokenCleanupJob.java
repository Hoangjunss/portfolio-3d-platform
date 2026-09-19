package com.portfolio.platform.scheduler;

import com.portfolio.platform.service.RefreshTokenService;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class RefreshTokenCleanupJob {

    private final RefreshTokenService refreshTokenService;

    public RefreshTokenCleanupJob(RefreshTokenService refreshTokenService) {
        this.refreshTokenService = refreshTokenService;
    }

    // Revoked-but-unexpired rows are kept on purpose: they are what makes a replayed
    // refresh token fail instead of silently looking unknown.
    @Scheduled(cron = "0 30 3 * * *")
    public void purgeExpiredTokens() {
        refreshTokenService.purgeExpired();
    }
}
