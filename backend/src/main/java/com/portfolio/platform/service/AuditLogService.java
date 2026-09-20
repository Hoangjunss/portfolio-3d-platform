package com.portfolio.platform.service;

import com.portfolio.platform.dto.AuditLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    void record(String entityType, String action, Long entityId, Long userId, String ipAddress);

    Page<AuditLogDto> list(String entityType, Long entityId, Pageable pageable);
}
