package com.portfolio.platform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "settings")
@Getter
@Setter
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quoted identifier because KEY is a reserved word in H2
    @Column(name = "\"key\"", nullable = false, unique = true, length = 128)
    private String key;

    // Plain String without columnDefinition="jsonb" to maintain H2 compatibility in tests
    @Column(name = "value_json", nullable = false)
    private String valueJson;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touchUpdatedAt() {
        updatedAt = Instant.now();
    }
}
