package com.portfolio.platform.converter;

import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.model.ContentSection;

public interface ContentSectionConverter {

    ContentSectionDto toDto(ContentSection entity);
}
