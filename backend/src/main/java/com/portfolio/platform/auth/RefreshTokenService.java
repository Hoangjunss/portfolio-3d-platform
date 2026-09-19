package com.portfolio.platform.auth;

import com.portfolio.platform.dto.RotationDto;
import com.portfolio.platform.model.RefreshToken;
import com.portfolio.platform.model.User;
import com.portfolio.platform.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository,
                               JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtProperties = jwtProperties;
    }

    public String issue(Long userId) {
        String rawToken = generateRawToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setTokenHash(sha256(rawToken));
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.refreshTtlDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public Optional<RotationDto> rotate(String rawToken) {
        var storedOpt = refreshTokenRepository.findByTokenHash(sha256(rawToken));
        if (storedOpt.isEmpty()) {
            return Optional.empty();
        }

        var stored = storedOpt.get();
        if (stored.isRevoked()) {
            // Presenting an already-spent token indicates the token leaked, so revoke all
            // live refresh tokens for this user to protect against an active session hijack.
            refreshTokenRepository.revokeAllForUser(stored.getUserId());
            return Optional.empty();
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        // The only server-side account check in the whole JWT flow: a deactivated user keeps a
        // valid access token until it expires, but must not be able to extend the session.
        var user = userRepository.findById(stored.getUserId()).filter(User::isActive);
        if (user.isEmpty()) {
            return Optional.empty();
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return Optional.of(new RotationDto(user.get(), issue(user.get().getId())));
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHashAndRevokedFalse(sha256(rawToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
