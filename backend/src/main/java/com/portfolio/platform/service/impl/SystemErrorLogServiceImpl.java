package com.portfolio.platform.service.impl;

import com.portfolio.platform.converter.SystemErrorLogConverter;
import com.portfolio.platform.dto.SystemErrorLogDto;
import com.portfolio.platform.model.SystemErrorLog;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.service.SystemErrorLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;

@Service
public class SystemErrorLogServiceImpl implements SystemErrorLogService {

    private final SystemErrorLogRepository systemErrorLogRepository;
    private final SystemErrorLogConverter systemErrorLogConverter;

    public SystemErrorLogServiceImpl(SystemErrorLogRepository systemErrorLogRepository,
                                     SystemErrorLogConverter systemErrorLogConverter) {
        this.systemErrorLogRepository = systemErrorLogRepository;
        this.systemErrorLogConverter = systemErrorLogConverter;
    }

    @Override
    @Transactional
    public void record(String endpoint, int httpStatus, Exception ex, String requestId) {
        String exceptionClass = ex.getClass().getName();
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        String stacktrace = sw.toString();

        record(endpoint, httpStatus, exceptionClass, ex.getMessage(), stacktrace, requestId);
    }

    @Override
    @Transactional
    public void record(String endpoint, int httpStatus, String exceptionClass, String message, String stacktrace, String requestId) {
        if (endpoint != null && endpoint.length() > 255) {
            endpoint = endpoint.substring(0, 255);
        }
        if (exceptionClass != null && exceptionClass.length() > 255) {
            exceptionClass = exceptionClass.substring(0, 255);
        }

        SystemErrorLog log = new SystemErrorLog();
        log.setEndpoint(endpoint != null ? endpoint : "");
        log.setHttpStatus(httpStatus);
        log.setExceptionClass(exceptionClass != null ? exceptionClass : "");
        log.setMessage(message);
        log.setStacktrace(stacktrace);
        log.setRequestId(requestId);
        systemErrorLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemErrorLogDto> list(Pageable pageable) {
        return systemErrorLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(systemErrorLogConverter::toDto);
    }
}
