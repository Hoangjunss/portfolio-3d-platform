package com.portfolio.platform.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.portfolio.platform.config.RateLimitProperties;
import com.portfolio.platform.config.RateLimitProperties.LimitSpec;
import com.portfolio.platform.dto.ApiErrorDto;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_CACHE_SIZE = 10_000;
    // Twice the longest refill window (1 hour for leads -> 2 hours).
    private static final Duration CACHE_EXPIRY = Duration.ofHours(2);

    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Cache<String, Bucket> cache;

    public RateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.cache = Caffeine.newBuilder()
                .maximumSize(MAX_CACHE_SIZE)
                .expireAfterAccess(CACHE_EXPIRY)
                .build();
    }

    public Cache<String, Bucket> getCache() {
        return cache;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String servletPath = request.getServletPath();
        if (servletPath == null || servletPath.isEmpty()) {
            servletPath = request.getPathInfo() != null ? request.getPathInfo() : request.getRequestURI();
        }
        LimitSpec limitSpec = properties.getLimitSpec(servletPath);

        if (limitSpec == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Key on getRemoteAddr() only, never X-Forwarded-For (spoofable by client).
        String clientIp = request.getRemoteAddr();
        String normalizedPath = normalizePath(servletPath);
        String bucketKey = normalizedPath + ":" + (clientIp != null ? clientIp : "unknown");

        Bucket bucket = cache.get(bucketKey, k -> createBucket(limitSpec));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
        } else {
            long retryAfterSeconds = Math.max(1L, (long) Math.ceil(probe.getNanosToWaitForRefill() / 1_000_000_000.0));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));

            ApiErrorDto error = new ApiErrorDto("RATE_LIMITED", "Too many requests", null);
            response.getWriter().write(objectMapper.writeValueAsString(error));
        }
    }

    private Bucket createBucket(LimitSpec limitSpec) {
        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(limitSpec.capacity())
                .refillGreedy(limitSpec.capacity(), limitSpec.window())
                .build();
        return Bucket.builder()
                .addLimit(bandwidth)
                .build();
    }

    private String normalizePath(String path) {
        if (path != null && path.length() > 1 && path.endsWith("/")) {
            return path.substring(0, path.length() - 1);
        }
        return path;
    }
}
