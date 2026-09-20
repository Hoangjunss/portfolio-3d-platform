package com.portfolio.platform.converter;

import com.portfolio.platform.converter.impl.AuditLogConverterImpl;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.model.AuditLog;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLogConverterTest {

    private final AuditLogConverter converter = new AuditLogConverterImpl();

    @Test
    void toEntity_mapsAllFieldsCorrectly() {
        AuditLog entity = converter.toEntity("Template", "CREATE", 42L, 10L, "127.0.0.1");

        assertThat(entity).isNotNull();
        assertThat(entity.getEntityType()).isEqualTo("Template");
        assertThat(entity.getAction()).isEqualTo("CREATE");
        assertThat(entity.getEntityId()).isEqualTo(42L);
        assertThat(entity.getUserId()).isEqualTo(10L);
        assertThat(entity.getIpAddress()).isEqualTo("127.0.0.1");
    }

    @Test
    void toDto_mapsAllFieldsCorrectly() {
        AuditLog entity = new AuditLog();
        entity.setId(1L);
        entity.setUserId(2L);
        entity.setAction("UPDATE");
        entity.setEntityType("Template");
        entity.setEntityId(3L);
        entity.setOldValueJson("{\"name\":\"old\"}");
        entity.setNewValueJson("{\"name\":\"new\"}");
        entity.setIpAddress("192.168.1.1");
        Instant now = Instant.now();
        entity.setCreatedAt(now);

        AuditLogDto dto = converter.toDto(entity);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.userId()).isEqualTo(2L);
        assertThat(dto.action()).isEqualTo("UPDATE");
        assertThat(dto.entityType()).isEqualTo("Template");
        assertThat(dto.entityId()).isEqualTo(3L);
        assertThat(dto.oldValueJson()).isEqualTo("{\"name\":\"old\"}");
        assertThat(dto.newValueJson()).isEqualTo("{\"name\":\"new\"}");
        assertThat(dto.ipAddress()).isEqualTo("192.168.1.1");
        assertThat(dto.createdAt()).isEqualTo(now);
    }

    @Test
    void toDto_returnsNull_whenEntityIsNull() {
        assertThat(converter.toDto(null)).isNull();
    }
}
