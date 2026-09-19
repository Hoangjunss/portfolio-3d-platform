package com.portfolio.platform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "templates")
@Getter
@Setter
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 128)
    private String slug;

    @Column(nullable = false, unique = true, length = 128)
    private String subdomain;

    @Column(name = "thumbnail_media_id")
    private Long thumbnailMediaId;

    @Column
    private String description;

    @Column(length = 128)
    private String category;

    @Column(name = "tech_tags", length = 512)
    private String techTags;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "click_count", nullable = false)
    private long clickCount = 0;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PreUpdate
    void touchUpdatedAt() {
        updatedAt = Instant.now();
    }
}
