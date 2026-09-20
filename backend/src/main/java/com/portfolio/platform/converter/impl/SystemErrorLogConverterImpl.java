package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.SystemErrorLogConverter;
import com.portfolio.platform.dto.SystemErrorLogDto;
import com.portfolio.platform.model.SystemErrorLog;
import org.springframework.stereotype.Component;

@Component
public class SystemErrorLogConverterImpl implements SystemErrorLogConverter {

    @Override
    public SystemErrorLogDto toDto(SystemErrorLog entity) {
        if (entity == null) {
            return null;
        }
        return new SystemErrorLogDto(
                entity.getId(),
                entity.getEndpoint(),
                entity.getHttpStatus(),
                entity.getExceptionClass(),
                entity.getMessage(),
                entity.getStacktrace(),
                entity.getRequestId(),
                entity.getCreatedAt()
        );
    }
}
