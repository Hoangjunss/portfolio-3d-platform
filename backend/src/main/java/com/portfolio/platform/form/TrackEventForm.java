package com.portfolio.platform.form;

import com.portfolio.platform.enums.AnalyticsEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TrackEventForm(
        @NotNull AnalyticsEventType eventType,
        Long templateId,
        @NotBlank @Size(max = 128) String sessionId
) {
}
