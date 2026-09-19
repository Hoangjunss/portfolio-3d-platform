package com.portfolio.platform.form;

import jakarta.validation.constraints.NotBlank;

public record ContentSectionUpsertForm(
        @NotBlank String dataJson
) {
}
