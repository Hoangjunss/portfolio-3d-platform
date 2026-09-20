package com.portfolio.platform.model;

import com.portfolio.platform.enums.LeadStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "leads")
@Getter
@Setter
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "source_template_id")
    private Long sourceTemplateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "internal_note", columnDefinition = "text")
    private String internalNote;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
