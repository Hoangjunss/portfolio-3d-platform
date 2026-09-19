package com.portfolio.platform.audit;

import com.portfolio.platform.model.SystemErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemErrorLogRepository extends JpaRepository<SystemErrorLog, Long> {
}
