package com.portfolio.platform.service;

import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.form.TemplateUpsertForm;

import java.util.List;

public interface TemplateService {

    List<TemplateDto> listActive();

    List<TemplateDto> listAllForAdmin();

    // Mutating methods return the entity Long ID so AuditAspect can populate audit_logs.entity_id.
    Long create(TemplateUpsertForm form, String username);

    Long update(Long id, TemplateUpsertForm form);

    Long softDelete(Long id);

    void incrementClickCount(Long id);
}
