package com.portfolio.platform.repository;

import com.portfolio.platform.dto.TemplateClickCountDto;
import com.portfolio.platform.enums.AnalyticsEventType;
import com.portfolio.platform.model.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    long countByEventType(AnalyticsEventType eventType);

    @Query("""
        SELECT new com.portfolio.platform.dto.TemplateClickCountDto(e.templateId, COUNT(e))
        FROM AnalyticsEvent e
        WHERE e.eventType = com.portfolio.platform.enums.AnalyticsEventType.TEMPLATE_CLICK AND e.templateId IS NOT NULL
        GROUP BY e.templateId
        ORDER BY COUNT(e) DESC
        """)
    List<TemplateClickCountDto> topClickedTemplates(Pageable pageable);
}
