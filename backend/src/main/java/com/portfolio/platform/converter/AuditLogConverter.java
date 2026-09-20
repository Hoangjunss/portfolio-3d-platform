package com.portfolio.platform.converter;

import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.model.AuditLog;

public interface AuditLogConverter {

    AuditLog toEntity(String entityType, String action, Long entityId, Long userId, String ipAddress);

    AuditLogDto toDto(AuditLog auditLog);
}
