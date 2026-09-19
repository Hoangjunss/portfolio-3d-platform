package com.portfolio.platform.form;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenForm(@NotBlank String refreshToken) {
}
