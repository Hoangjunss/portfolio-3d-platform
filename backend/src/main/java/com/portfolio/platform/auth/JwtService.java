package com.portfolio.platform.auth;

import com.portfolio.platform.user.Role;
import com.portfolio.platform.user.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    public record Claims(String username, Role role) {
    }

    private final SecretKey accessKey;
    private final JwtProperties props;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.accessKey = Keys.hmacShaKeyFor(props.accessSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(Duration.ofMinutes(props.accessTtlMinutes()))))
                .id(UUID.randomUUID().toString())
                .signWith(accessKey)
                .compact();
    }

    public Optional<Claims> validateAccessToken(String token) {
        try {
            var jws = Jwts.parser().verifyWith(accessKey).build().parseSignedClaims(token);
            String username = jws.getPayload().getSubject();
            Role role = Role.valueOf(jws.getPayload().get("role", String.class));
            return Optional.of(new Claims(username, role));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
