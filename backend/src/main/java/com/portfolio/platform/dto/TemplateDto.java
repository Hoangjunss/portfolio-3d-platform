package com.portfolio.platform.dto;

public record TemplateDto(
        Long id,
        String name,
        String slug,
        String subdomain,
        Long thumbnailMediaId,
        String description,
        String category,
        String techTags,
        int displayOrder,
        boolean active,
        long viewCount,
        long clickCount
) {
}
