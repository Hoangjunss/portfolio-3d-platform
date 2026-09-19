package com.portfolio.platform.service;

public interface SystemErrorLogService {

    void record(String endpoint, int httpStatus, Exception ex, String requestId);

    void record(String endpoint, int httpStatus, String exceptionClass, String message, String stacktrace, String requestId);
}
