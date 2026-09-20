package com.portfolio.platform.service;

import com.portfolio.platform.dto.SystemErrorLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SystemErrorLogService {

    void record(String endpoint, int httpStatus, Exception ex, String requestId);

    void record(String endpoint, int httpStatus, String exceptionClass, String message, String stacktrace, String requestId);

    Page<SystemErrorLogDto> list(Pageable pageable);
}
