package com.portfolio.platform.service.impl;

import com.portfolio.platform.config.AnalyticsProperties;
import com.portfolio.platform.dto.AnalyticsSummaryDto;
import com.portfolio.platform.dto.TemplateClickCountDto;
import com.portfolio.platform.enums.AnalyticsEventType;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.form.TrackEventForm;
import com.portfolio.platform.model.AnalyticsEvent;
import com.portfolio.platform.repository.AnalyticsEventRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.AnalyticsService;
import com.portfolio.platform.service.TemplateService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final TemplateRepository templateRepository;
    private final TemplateService templateService;
    private final AnalyticsProperties analyticsProperties;

    public AnalyticsServiceImpl(
            AnalyticsEventRepository analyticsEventRepository,
            TemplateRepository templateRepository,
            TemplateService templateService,
            AnalyticsProperties analyticsProperties
    ) {
        this.analyticsEventRepository = analyticsEventRepository;
        this.templateRepository = templateRepository;
        this.templateService = templateService;
        this.analyticsProperties = analyticsProperties;
    }

    @Override
    @Transactional
    public void track(TrackEventForm form, String rawIp, String userAgent, String referrer) {
        if (form.templateId() != null && !templateRepository.existsById(form.templateId())) {
            throw new InvalidRequestException("Unknown template");
        }

        AnalyticsEvent event = new AnalyticsEvent();
        event.setEventType(form.eventType());
        event.setTemplateId(form.templateId());
        event.setSessionId(form.sessionId());
        event.setIpHash(hashIp(rawIp));

        // Truncate to column widths (512 for user_agent, 1024 for referrer):
        // analytics rejecting real traffic with long UA/referrer is worse than storing a clipped string.
        event.setUserAgent(truncate(userAgent, 512));
        event.setReferrer(truncate(referrer, 1024));

        analyticsEventRepository.save(event);

        if (form.templateId() != null) {
            if (form.eventType() == AnalyticsEventType.TEMPLATE_CLICK) {
                templateService.incrementClickCount(form.templateId());
            } else if (form.eventType() == AnalyticsEventType.PAGE_VIEW) {
                templateService.incrementViewCount(form.templateId());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsSummaryDto summary() {
        long totalViews = analyticsEventRepository.countByEventType(AnalyticsEventType.PAGE_VIEW);
        long totalClicks = analyticsEventRepository.countByEventType(AnalyticsEventType.TEMPLATE_CLICK);
        List<TemplateClickCountDto> topTemplates = analyticsEventRepository.topClickedTemplates(PageRequest.of(0, 10));
        return new AnalyticsSummaryDto(totalViews, totalClicks, topTemplates);
    }

    private String hashIp(String rawIp) {
        if (rawIp == null) {
            rawIp = "";
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            // No null fallback on purpose: AnalyticsProperties already carries a default, and a
            // second hardcoded copy of it here would quietly keep hashing with a secret that is
            // published in this repo. If the secret is ever null, failing is the correct outcome.
            String secret = analyticsProperties.getIpHashSecret();
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(rawIp.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256 for IP", e);
        }
    }

    private String truncate(String val, int maxLen) {
        if (val != null && val.length() > maxLen) {
            return val.substring(0, maxLen);
        }
        return val;
    }
}
