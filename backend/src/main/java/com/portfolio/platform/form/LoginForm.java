package com.portfolio.platform.form;

import jakarta.validation.constraints.NotBlank;

public record LoginForm(@NotBlank String username, @NotBlank String password) {
}
