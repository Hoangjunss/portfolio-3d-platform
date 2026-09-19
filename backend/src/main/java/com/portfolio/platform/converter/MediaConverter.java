package com.portfolio.platform.converter;

import com.portfolio.platform.dto.MediaDto;
import com.portfolio.platform.model.Media;

public interface MediaConverter {

    MediaDto toDto(Media media);
}
