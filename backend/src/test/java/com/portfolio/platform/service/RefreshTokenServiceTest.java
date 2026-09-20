package com.portfolio.platform.service;

import com.portfolio.platform.model.RefreshToken;
import com.portfolio.platform.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenServiceTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
    }

    @Test
    void issue_whenLiveTokensExceedCap_evictsOldestTokens() {
        Long userId = 42L;
        int cap = 5;
        List<String> rawTokens = new ArrayList<>();

        for (int i = 0; i < cap + 2; i++) {
            rawTokens.add(refreshTokenService.issue(userId));
        }

        List<RefreshToken> allTokens = refreshTokenRepository.findAll();
        assertThat(allTokens).hasSize(cap + 2);

        List<RefreshToken> liveTokens = allTokens.stream()
                .filter(t -> !t.isRevoked())
                .toList();
        assertThat(liveTokens).hasSize(cap);

        // Verify the 2 oldest tokens are evicted (revoked = true)
        for (int i = 0; i < 2; i++) {
            String hash = sha256(rawTokens.get(i));
            RefreshToken token = refreshTokenRepository.findByTokenHash(hash).orElseThrow();
            assertThat(token.isRevoked())
                    .as("Oldest token at index %d must be evicted (revoked)", i)
                    .isTrue();
        }

        // Verify the survivors are the newest (revoked = false)
        for (int i = 2; i < cap + 2; i++) {
            String hash = sha256(rawTokens.get(i));
            RefreshToken token = refreshTokenRepository.findByTokenHash(hash).orElseThrow();
            assertThat(token.isRevoked())
                    .as("Newest token at index %d must remain live", i)
                    .isFalse();
        }
    }

    private String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
