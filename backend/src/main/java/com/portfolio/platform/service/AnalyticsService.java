package com.portfolio.platform.service;

import com.portfolio.platform.dto.AnalyticsSummaryDto;
import com.portfolio.platform.form.TrackEventForm;

public interface AnalyticsService {

    void track(TrackEventForm form, String rawIp, String userAgent, String referrer);

    AnalyticsSummaryDto summary();
}
