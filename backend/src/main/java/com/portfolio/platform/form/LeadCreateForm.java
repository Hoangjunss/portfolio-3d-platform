package com.portfolio.platform.form;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LeadCreateForm(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 32) String phone,
        @Size(max = 5000) String message,
        Long sourceTemplateId) {
}
