package com.portfolio.platform.service.impl;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.service.AuditLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogConverter auditLogConverter;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, AuditLogConverter auditLogConverter) {
        this.auditLogRepository = auditLogRepository;
        this.auditLogConverter = auditLogConverter;
    }

    @Override
    @Transactional
    public void record(String entityType, String action, Long entityId, Long userId, String ipAddress) {
        AuditLog log = auditLogConverter.toEntity(entityType, action, entityId, userId, ipAddress);
        auditLogRepository.save(log);
    }
}
