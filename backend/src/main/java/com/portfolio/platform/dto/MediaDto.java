package com.portfolio.platform.dto;

public record MediaDto(
        Long id,
        String fileName,
        String url,
        String mimeType,
        long sizeBytes
) {
}
