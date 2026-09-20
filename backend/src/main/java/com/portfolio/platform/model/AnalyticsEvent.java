package com.portfolio.platform.model;

import com.portfolio.platform.enums.AnalyticsEventType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "analytics_events")
@Getter
@Setter
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private AnalyticsEventType eventType;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "session_id", nullable = false, length = 128)
    private String sessionId;

    @Column(name = "ip_hash", nullable = false, length = 128)
    private String ipHash;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(length = 1024)
    private String referrer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
