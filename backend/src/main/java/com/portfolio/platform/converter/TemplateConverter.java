package com.portfolio.platform.converter;

import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.Template;

import java.util.List;

public interface TemplateConverter {

    TemplateDto toDto(Template template);

    List<TemplateDto> toDtoList(List<Template> templates);

    void applyForm(Template target, TemplateUpsertForm form);
}
