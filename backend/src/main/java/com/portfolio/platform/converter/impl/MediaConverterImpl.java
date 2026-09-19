package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.MediaConverter;
import com.portfolio.platform.dto.MediaDto;
import com.portfolio.platform.model.Media;
import org.springframework.stereotype.Component;

@Component
public class MediaConverterImpl implements MediaConverter {

    @Override
    public MediaDto toDto(Media media) {
        if (media == null) {
            return null;
        }
        return new MediaDto(
                media.getId(),
                media.getFileName(),
                media.getUrl(),
                media.getMimeType(),
                media.getSizeBytes()
        );
    }
}
