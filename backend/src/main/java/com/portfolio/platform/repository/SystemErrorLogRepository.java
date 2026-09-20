package com.portfolio.platform.repository;

import com.portfolio.platform.model.SystemErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemErrorLogRepository extends JpaRepository<SystemErrorLog, Long> {

    Page<SystemErrorLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
