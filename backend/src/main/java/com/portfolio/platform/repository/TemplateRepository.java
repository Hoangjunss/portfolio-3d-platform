package com.portfolio.platform.repository;

import com.portfolio.platform.model.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    List<Template> findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();

    List<Template> findByDeletedAtIsNullOrderByDisplayOrderAsc();

    @Modifying
    @Query("update Template t set t.clickCount = t.clickCount + 1 where t.id = :id")
    int incrementClickCount(@Param("id") Long id);
}
