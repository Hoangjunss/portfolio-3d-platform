package com.portfolio.platform.controller;

import com.portfolio.platform.form.TrackEventForm;
import com.portfolio.platform.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class PublicAnalyticsController {

    private final AnalyticsService analyticsService;

    public PublicAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/events")
    public ResponseEntity<Void> track(@Valid @RequestBody TrackEventForm form, HttpServletRequest request) {
        String clientIp = resolveClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        String referrer = request.getHeader(HttpHeaders.REFERER);
        analyticsService.track(form, clientIp, userAgent, referrer);
        return ResponseEntity.accepted().build();
    }

    // Read the first hop of X-Forwarded-For when present, else getRemoteAddr().
    // WHY: Client can forge X-Forwarded-For, so this value is not evidence of anything —
    // it is a coarse uniqueness signal for analytics only, and must never be used for
    // security decisions or rate limiting.
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int commaIdx = xff.indexOf(',');
            return commaIdx != -1 ? xff.substring(0, commaIdx).trim() : xff.trim();
        }
        return request.getRemoteAddr();
    }
}
