package com.portfolio.platform.dto;

import java.util.List;

public record AnalyticsSummaryDto(
        long totalViews,
        long totalClicks,
        List<TemplateClickCountDto> topTemplates
) {
}
