package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.converter.TemplateConverter;
import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.Template;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.TemplateService;
import com.portfolio.platform.service.UserService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class TemplateServiceImpl implements TemplateService {

    private final TemplateRepository templateRepository;
    private final TemplateConverter templateConverter;
    private final UserService userService;

    public TemplateServiceImpl(TemplateRepository templateRepository,
                               TemplateConverter templateConverter,
                               UserService userService) {
        this.templateRepository = templateRepository;
        this.templateConverter = templateConverter;
        this.userService = userService;
    }

    @Override
    @Cacheable("public-templates")
    @Transactional(readOnly = true)
    public List<TemplateDto> listActive() {
        return templateConverter.toDtoList(
                templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateDto> listAllForAdmin() {
        return templateConverter.toDtoList(
                templateRepository.findByDeletedAtIsNullOrderByDisplayOrderAsc()
        );
    }

    @Override
    @Audited(entityType = "Template", action = "CREATE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long create(TemplateUpsertForm form, String username) {
        Long createdBy = username != null ? userService.findIdByUsername(username).orElse(null) : null;
        Template template = new Template();
        templateConverter.applyForm(template, form);
        template.setCreatedBy(createdBy);
        Template saved = templateRepository.save(template);
        return saved.getId();
    }

    @Override
    @Audited(entityType = "Template", action = "UPDATE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long update(Long id, TemplateUpsertForm form) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", id));
        templateConverter.applyForm(template, form);
        Template saved = templateRepository.save(template);
        return saved.getId();
    }

    @Override
    @Audited(entityType = "Template", action = "DELETE")
    @CacheEvict(value = "public-templates", allEntries = true)
    @Transactional
    public Long softDelete(Long id) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", id));
        template.setDeletedAt(Instant.now());
        template.setActive(false);
        Template saved = templateRepository.save(template);
        return saved.getId();
    }

    @Override
    @Transactional
    public void incrementClickCount(Long id) {
        templateRepository.incrementClickCount(id);
    }
}
