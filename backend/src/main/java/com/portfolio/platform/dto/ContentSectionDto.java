package com.portfolio.platform.dto;

import java.io.Serializable;
import java.time.Instant;

public record ContentSectionDto(
        String sectionKey,
        String dataJson,
        int version,
        Instant updatedAt
) implements Serializable {
}
