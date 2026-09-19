package com.portfolio.platform.auth;

import com.portfolio.platform.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        var user = userRepository.findByUsername(request.username())
                .filter(u -> u.isActive() && passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.issue(user.getId());

        return ResponseEntity.ok(new TokenResponse(accessToken, rawRefreshToken));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return refreshTokenService.rotate(request.refreshToken())
                .map(rotation -> ResponseEntity.ok(new TokenResponse(
                        jwtService.generateAccessToken(rotation.user()),
                        rotation.rawRefreshToken())))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    // Always 204: telling the caller whether a row matched would turn this into a
    // token-validity oracle.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        refreshTokenService.revoke(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
