package com.portfolio.platform.form;

import jakarta.validation.constraints.NotBlank;

public record TemplateUpsertForm(
        @NotBlank String name,
        @NotBlank String slug,
        @NotBlank String subdomain,
        Long thumbnailMediaId,
        String description,
        String category,
        String techTags,
        Integer displayOrder,
        Boolean active
) {
}
