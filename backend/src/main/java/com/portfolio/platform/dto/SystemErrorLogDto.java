package com.portfolio.platform.dto;

import java.time.Instant;

public record SystemErrorLogDto(
        Long id,
        String endpoint,
        int httpStatus,
        String exceptionClass,
        String message,
        String stacktrace,
        String requestId,
        Instant createdAt
) {
}
