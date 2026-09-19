package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.ContentSectionConverter;
import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.model.ContentSection;
import org.springframework.stereotype.Component;

@Component
public class ContentSectionConverterImpl implements ContentSectionConverter {

    @Override
    public ContentSectionDto toDto(ContentSection entity) {
        if (entity == null) {
            return null;
        }
        return new ContentSectionDto(
                entity.getSectionKey(),
                entity.getDataJson(),
                entity.getVersion(),
                entity.getUpdatedAt()
        );
    }
}
