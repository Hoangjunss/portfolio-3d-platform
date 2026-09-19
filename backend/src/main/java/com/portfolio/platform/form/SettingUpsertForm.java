package com.portfolio.platform.form;

import jakarta.validation.constraints.NotBlank;

public record SettingUpsertForm(
        @NotBlank String valueJson
) {
}
