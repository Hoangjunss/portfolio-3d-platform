package com.portfolio.platform.service.impl;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> list(String entityType, Long entityId, Pageable pageable) {
        if (!StringUtils.hasText(entityType)) {
            throw new InvalidRequestException("entityType is required");
        }
        Page<AuditLog> page = (entityId != null)
                ? auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable)
                : auditLogRepository.findByEntityType(entityType, pageable);
        return page.map(auditLogConverter::toDto);
    }
}
