package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.AuditLogConverter;
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
}
