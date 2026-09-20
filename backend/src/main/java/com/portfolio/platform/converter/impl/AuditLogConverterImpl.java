package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.model.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogConverterImpl implements AuditLogConverter {

    @Override
    public AuditLog toEntity(String entityType, String action, Long entityId, Long userId, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setEntityType(entityType);
        log.setAction(action);
        log.setEntityId(entityId);
        log.setUserId(userId);
        log.setIpAddress(ipAddress);
        return log;
    }

    @Override
    public AuditLogDto toDto(AuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }
        return new AuditLogDto(
                auditLog.getId(),
                auditLog.getUserId(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getOldValueJson(),
                auditLog.getNewValueJson(),
                auditLog.getIpAddress(),
                auditLog.getCreatedAt()
        );
    }
}
