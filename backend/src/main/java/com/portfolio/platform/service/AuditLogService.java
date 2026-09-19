package com.portfolio.platform.service;

public interface AuditLogService {

    void record(String entityType, String action, Long entityId, Long userId, String ipAddress);
}
