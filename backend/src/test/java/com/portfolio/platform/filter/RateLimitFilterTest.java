package com.portfolio.platform.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.config.RateLimitProperties;
import com.portfolio.platform.config.RateLimitProperties.LimitSpec;
import com.portfolio.platform.dto.ApiErrorDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private ObjectMapper objectMapper;
    private RateLimitProperties properties;
    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        properties = new RateLimitProperties();
        properties.setPaths(Map.of(
                "/api/auth/login", new LimitSpec(10, Duration.ofMinutes(15)),
                "/api/public/leads", new LimitSpec(5, Duration.ofHours(1)),
                "/api/analytics/events", new LimitSpec(120, Duration.ofMinutes(1))
        ));
        filter = new RateLimitFilter(properties, objectMapper);
    }

    @Test
    void withinLimit_passesThrough() throws Exception {
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/public/leads");
            request.setServletPath("/api/public/leads");
            request.setRemoteAddr("192.168.1.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);

            assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
            assertThat(chain.getRequest()).isNotNull();
        }
    }

    @Test
    void overLimit_returns429WithJsonBodyAndRetryAfter() throws Exception {
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/public/leads");
            request.setServletPath("/api/public/leads");
            request.setRemoteAddr("10.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(request, response, chain);
            assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
        }

        MockHttpServletRequest overLimitRequest = new MockHttpServletRequest("POST", "/api/public/leads");
        overLimitRequest.setServletPath("/api/public/leads");
        overLimitRequest.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse overLimitResponse = new MockHttpServletResponse();
        MockFilterChain overLimitChain = new MockFilterChain();

        filter.doFilter(overLimitRequest, overLimitResponse, overLimitChain);

        assertThat(overLimitResponse.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(overLimitResponse.getHeader(HttpHeaders.RETRY_AFTER)).isNotNull();
        long retryAfter = Long.parseLong(overLimitResponse.getHeader(HttpHeaders.RETRY_AFTER));
        assertThat(retryAfter).isGreaterThan(0L);
        assertThat(overLimitResponse.getContentType()).isEqualTo(MediaType.APPLICATION_JSON_VALUE);

        ApiErrorDto error = objectMapper.readValue(overLimitResponse.getContentAsString(), ApiErrorDto.class);
        assertThat(error.code()).isEqualTo("RATE_LIMITED");
        assertThat(error.message()).isEqualTo("Too many requests");
        assertThat(overLimitChain.getRequest()).isNull();
    }

    @Test
    void differentIps_haveIndependentBuckets() throws Exception {
        // Exhaust limit for IP 1
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/public/leads");
            req.setServletPath("/api/public/leads");
            req.setRemoteAddr("1.1.1.1");
            filter.doFilter(req, new MockHttpServletResponse(), new MockFilterChain());
        }

        // IP 1 6th request is blocked
        MockHttpServletRequest req1Blocked = new MockHttpServletRequest("POST", "/api/public/leads");
        req1Blocked.setServletPath("/api/public/leads");
        req1Blocked.setRemoteAddr("1.1.1.1");
        MockHttpServletResponse res1Blocked = new MockHttpServletResponse();
        filter.doFilter(req1Blocked, res1Blocked, new MockFilterChain());
        assertThat(res1Blocked.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());

        // IP 2 is still within limit
        MockHttpServletRequest req2 = new MockHttpServletRequest("POST", "/api/public/leads");
        req2.setServletPath("/api/public/leads");
        req2.setRemoteAddr("2.2.2.2");
        MockHttpServletResponse res2 = new MockHttpServletResponse();
        MockFilterChain chain2 = new MockFilterChain();
        filter.doFilter(req2, res2, chain2);
        assertThat(res2.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(chain2.getRequest()).isNotNull();
    }

    @Test
    void sameIpDifferentXForwardedFor_shareSameBucket() throws Exception {
        // RemoteAddr is 10.0.0.1 for all requests, but client rotates X-Forwarded-For
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/public/leads");
            req.setServletPath("/api/public/leads");
            req.setRemoteAddr("10.0.0.1");
            req.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(HttpStatus.OK.value());
        }

        // 6th request with yet another forged X-Forwarded-For MUST STILL be rate-limited (decision (g))
        MockHttpServletRequest req6 = new MockHttpServletRequest("POST", "/api/public/leads");
        req6.setServletPath("/api/public/leads");
        req6.setRemoteAddr("10.0.0.1");
        req6.addHeader("X-Forwarded-For", "198.51.100.99");
        MockHttpServletResponse res6 = new MockHttpServletResponse();
        filter.doFilter(req6, res6, new MockFilterChain());
        assertThat(res6.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void unlistedPath_isNeverLimited() throws Exception {
        for (int i = 0; i < 1_000; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/public/templates");
            req.setServletPath("/api/public/templates");
            req.setRemoteAddr("192.168.1.100");
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertThat(res.getStatus()).isEqualTo(HttpStatus.OK.value());
            assertThat(chain.getRequest()).isNotNull();
        }
    }

    @Test
    void trailingSlash_isNormalizedAndSharesBucket() throws Exception {
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/public/leads/");
            req.setServletPath("/api/public/leads/");
            req.setRemoteAddr("172.16.0.1");
            filter.doFilter(req, new MockHttpServletResponse(), new MockFilterChain());
        }

        MockHttpServletRequest req6 = new MockHttpServletRequest("POST", "/api/public/leads");
        req6.setServletPath("/api/public/leads");
        req6.setRemoteAddr("172.16.0.1");
        MockHttpServletResponse res6 = new MockHttpServletResponse();
        filter.doFilter(req6, res6, new MockFilterChain());
        assertThat(res6.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void bucketCache_staysBounded() throws Exception {
        // Hammer filter with 20_000 distinct IPs (decision (c))
        for (int i = 0; i < 20_000; i++) {
            int b1 = (i >> 16) & 0xFF;
            int b2 = (i >> 8) & 0xFF;
            int b3 = i & 0xFF;
            String ip = "10." + b1 + "." + b2 + "." + b3;

            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/public/leads");
            req.setServletPath("/api/public/leads");
            req.setRemoteAddr(ip);
            filter.doFilter(req, new MockHttpServletResponse(), new MockFilterChain());
        }

        // Trigger Caffeine maintenance to evict over-capacity entries
        filter.getCache().cleanUp();
        assertThat(filter.getCache().estimatedSize()).isLessThanOrEqualTo(10_000L);
    }

    @Test
    void limitsAreSeparatedByPath() {
        LimitSpec login = properties.getLimitSpec("/api/auth/login");
        LimitSpec leads = properties.getLimitSpec("/api/public/leads");
        LimitSpec analytics = properties.getLimitSpec("/api/analytics/events");

        assertThat(login.capacity()).isEqualTo(10);
        assertThat(leads.capacity()).isEqualTo(5);
        assertThat(analytics.capacity()).isEqualTo(120);
        assertThat(analytics.capacity()).isGreaterThan(leads.capacity());
    }
}
