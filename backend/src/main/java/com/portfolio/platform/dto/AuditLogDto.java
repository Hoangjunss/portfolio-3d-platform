package com.portfolio.platform.dto;

import java.time.Instant;

public record AuditLogDto(
        Long id,
        Long userId,
        String action,
        String entityType,
        Long entityId,
        String oldValueJson,
        String newValueJson,
        String ipAddress,
        Instant createdAt
) {
}
