package com.portfolio.platform.audit;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemErrorLogRepository extends JpaRepository<SystemErrorLog, Long> {
}
