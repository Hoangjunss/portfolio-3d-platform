package com.portfolio.platform.dto;

import com.portfolio.platform.enums.LeadStatus;

import java.time.Instant;

/**
 * Lead data transfer object for admin views.
 *
 * NOTE: name, email, phone, and message are attacker-authored strings submitted
 * through an unauthenticated public form. They are stored as given.
 * internalNote and assignedTo are intentionally omitted until required by UI.
 */
public record LeadDto(
        Long id,
        String name,
        String email,
        String phone,
        String message,
        Long sourceTemplateId,
        LeadStatus status,
        Instant createdAt
) {
}
