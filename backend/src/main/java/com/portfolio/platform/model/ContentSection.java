package com.portfolio.platform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "content_sections")
@Getter
@Setter
public class ContentSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key", nullable = false, unique = true, length = 64)
    private String sectionKey;

    // Plain String without columnDefinition="jsonb" to maintain H2 compatibility in tests
    @Column(name = "data_json", nullable = false)
    private String dataJson;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touchUpdatedAt() {
        updatedAt = Instant.now();
    }
}
