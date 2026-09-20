package com.portfolio.platform.converter;

import com.portfolio.platform.dto.SystemErrorLogDto;
import com.portfolio.platform.model.SystemErrorLog;

public interface SystemErrorLogConverter {

    SystemErrorLogDto toDto(SystemErrorLog entity);
}
