package com.portfolio.platform.service.impl;

import com.portfolio.platform.config.JwtProperties;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.model.User;
import com.portfolio.platform.service.JwtService;
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
public class JwtServiceImpl implements JwtService {

    private final SecretKey accessKey;
    private final JwtProperties props;

    public JwtServiceImpl(JwtProperties props) {
        this.props = props;
        this.accessKey = Keys.hmacShaKeyFor(props.accessSecret().getBytes(StandardCharsets.UTF_8));
    }

    @Override
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

    @Override
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
