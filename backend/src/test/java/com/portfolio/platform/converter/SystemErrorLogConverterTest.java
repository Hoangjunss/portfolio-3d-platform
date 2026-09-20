package com.portfolio.platform.converter;

import com.portfolio.platform.converter.impl.SystemErrorLogConverterImpl;
import com.portfolio.platform.dto.SystemErrorLogDto;
import com.portfolio.platform.model.SystemErrorLog;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class SystemErrorLogConverterTest {

    private final SystemErrorLogConverter converter = new SystemErrorLogConverterImpl();

    @Test
    void toDto_mapsAllFieldsCorrectly() {
        SystemErrorLog entity = new SystemErrorLog();
        entity.setId(1L);
        entity.setEndpoint("/api/admin/templates");
        entity.setHttpStatus(500);
        entity.setExceptionClass("java.lang.NullPointerException");
        entity.setMessage("Null pointer occurred");
        entity.setStacktrace("java.lang.NullPointerException\n\tat com.portfolio.platform.service.impl.TemplateServiceImpl.get(TemplateServiceImpl.java:42)");
        entity.setRequestId("req-test-123");
        Instant now = Instant.now();
        entity.setCreatedAt(now);

        SystemErrorLogDto dto = converter.toDto(entity);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.endpoint()).isEqualTo("/api/admin/templates");
        assertThat(dto.httpStatus()).isEqualTo(500);
        assertThat(dto.exceptionClass()).isEqualTo("java.lang.NullPointerException");
        assertThat(dto.message()).isEqualTo("Null pointer occurred");
        assertThat(dto.stacktrace()).isEqualTo("java.lang.NullPointerException\n\tat com.portfolio.platform.service.impl.TemplateServiceImpl.get(TemplateServiceImpl.java:42)");
        assertThat(dto.requestId()).isEqualTo("req-test-123");
        assertThat(dto.createdAt()).isEqualTo(now);
    }

    @Test
    void toDto_returnsNull_whenEntityIsNull() {
        assertThat(converter.toDto(null)).isNull();
    }
}
