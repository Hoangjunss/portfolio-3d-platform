package com.portfolio.platform.error;

public record ApiError(String code, String message, String requestId) {
}
