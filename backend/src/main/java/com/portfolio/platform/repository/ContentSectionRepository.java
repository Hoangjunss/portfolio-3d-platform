package com.portfolio.platform.repository;

import com.portfolio.platform.model.ContentSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContentSectionRepository extends JpaRepository<ContentSection, Long> {

    Optional<ContentSection> findBySectionKey(String sectionKey);
}
