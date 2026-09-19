package com.portfolio.platform.dto;

import java.time.Instant;

public record SettingDto(
        String key,
        String valueJson,
        Instant updatedAt
) {
}
