package com.portfolio.platform.dto;

public record ApiErrorDto(String code, String message, String requestId) {
}
