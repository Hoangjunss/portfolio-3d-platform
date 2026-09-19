package com.portfolio.platform.auth;

import com.portfolio.platform.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthController(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder, JwtService jwtService, JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        var user = userRepository.findByUsername(request.username())
                .filter(u -> u.isActive() && passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = generateRawToken();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(sha256(rawRefreshToken));
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.refreshTtlDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        return ResponseEntity.ok(new TokenResponse(accessToken, rawRefreshToken));
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(value.getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
