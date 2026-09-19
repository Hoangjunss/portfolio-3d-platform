package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.TemplateConverter;
import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.Template;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TemplateConverterImpl implements TemplateConverter {

    @Override
    public TemplateDto toDto(Template template) {
        if (template == null) {
            return null;
        }
        return new TemplateDto(
                template.getId(),
                template.getName(),
                template.getSlug(),
                template.getSubdomain(),
                template.getThumbnailMediaId(),
                template.getDescription(),
                template.getCategory(),
                template.getTechTags(),
                template.getDisplayOrder(),
                template.isActive(),
                template.getViewCount(),
                template.getClickCount()
        );
    }

    @Override
    public List<TemplateDto> toDtoList(List<Template> templates) {
        if (templates == null) {
            return List.of();
        }
        return templates.stream().map(this::toDto).toList();
    }

    @Override
    public void applyForm(Template target, TemplateUpsertForm form) {
        target.setName(form.name());
        target.setSlug(form.slug());
        target.setSubdomain(form.subdomain());
        target.setThumbnailMediaId(form.thumbnailMediaId());
        target.setDescription(form.description());
        target.setCategory(form.category());
        target.setTechTags(form.techTags());
        if (form.displayOrder() != null) {
            target.setDisplayOrder(form.displayOrder());
        }
        if (form.active() != null) {
            target.setActive(form.active());
        }
    }
}
