package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.converter.ContentSectionConverter;
import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.ContentSectionUpsertForm;
import com.portfolio.platform.model.ContentSection;
import com.portfolio.platform.repository.ContentSectionRepository;
import com.portfolio.platform.service.ContentSectionService;
import com.portfolio.platform.service.UserService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContentSectionServiceImpl implements ContentSectionService {

    private final ContentSectionRepository contentSectionRepository;
    private final ContentSectionConverter contentSectionConverter;
    private final UserService userService;

    public ContentSectionServiceImpl(ContentSectionRepository contentSectionRepository,
                                     ContentSectionConverter contentSectionConverter,
                                     UserService userService) {
        this.contentSectionRepository = contentSectionRepository;
        this.contentSectionConverter = contentSectionConverter;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContentSectionDto> listAll() {
        return contentSectionRepository.findAll().stream()
                .map(contentSectionConverter::toDto)
                .toList();
    }

    // Returns Dto directly because Optional is not Serializable and fails with RedisCacheManager.
    @Override
    @Cacheable("content-sections")
    @Transactional(readOnly = true)
    public ContentSectionDto getByKey(String sectionKey) {
        ContentSection section = contentSectionRepository.findBySectionKey(sectionKey)
                .orElseThrow(() -> new ResourceNotFoundException("ContentSection", sectionKey));
        return contentSectionConverter.toDto(section);
    }

    // Single upsert audited as UPDATE to avoid internal proxy self-invocation bypass; returns Long for AuditAspect.
    @Override
    @Audited(entityType = "ContentSection", action = "UPDATE")
    @CacheEvict(value = "content-sections", allEntries = true)
    @Transactional
    public Long upsert(String sectionKey, ContentSectionUpsertForm form, String username) {
        Long updatedBy = username != null ? userService.findIdByUsername(username).orElse(null) : null;
        ContentSection section = contentSectionRepository.findBySectionKey(sectionKey)
                .map(existing -> {
                    existing.setDataJson(form.dataJson());
                    existing.setVersion(existing.getVersion() + 1);
                    return existing;
                })
                .orElseGet(() -> {
                    ContentSection created = new ContentSection();
                    created.setSectionKey(sectionKey);
                    created.setDataJson(form.dataJson());
                    created.setVersion(1);
                    return created;
                });

        section.setUpdatedBy(updatedBy);
        ContentSection saved = contentSectionRepository.save(section);
        return saved.getId();
    }
}
