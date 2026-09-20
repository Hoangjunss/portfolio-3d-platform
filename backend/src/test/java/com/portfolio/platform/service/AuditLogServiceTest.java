package com.portfolio.platform.service;

import com.portfolio.platform.converter.AuditLogConverter;
import com.portfolio.platform.dto.AuditLogDto;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.service.impl.AuditLogServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogConverter auditLogConverter;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    @Test
    void list_requiresEntityType_throwsWhenBlank() {
        assertThrows(InvalidRequestException.class,
                () -> auditLogService.list("", null, PageRequest.of(0, 20)));
    }

    @Test
    void list_requiresEntityType_throwsWhenNull() {
        assertThrows(InvalidRequestException.class,
                () -> auditLogService.list(null, null, PageRequest.of(0, 20)));
    }

    @Test
    void list_filtersByEntityTypeOnly_whenEntityIdNull() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setEntityType("Template");
        Page<AuditLog> page = new PageImpl<>(List.of(log));
        AuditLogDto dto = new AuditLogDto(1L, 1L, "CREATE", "Template", 10L, null, "{}", "127.0.0.1", Instant.now());

        when(auditLogRepository.findByEntityType(eq("Template"), any(Pageable.class))).thenReturn(page);
        when(auditLogConverter.toDto(log)).thenReturn(dto);

        Page<AuditLogDto> result = auditLogService.list("Template", null, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertThat(result.getContent().get(0)).isEqualTo(dto);
        verify(auditLogRepository).findByEntityType(eq("Template"), any(Pageable.class));
        verify(auditLogRepository, never()).findByEntityTypeAndEntityId(any(), any(), any());
    }

    @Test
    void list_filtersByEntityTypeAndEntityId_whenEntityIdProvided() {
        AuditLog log = new AuditLog();
        log.setId(2L);
        log.setEntityType("User");
        log.setEntityId(7L);
        Page<AuditLog> page = new PageImpl<>(List.of(log));
        AuditLogDto dto = new AuditLogDto(2L, 1L, "UPDATE", "User", 7L, "{}", "{}", "127.0.0.1", Instant.now());

        when(auditLogRepository.findByEntityTypeAndEntityId(eq("User"), eq(7L), any(Pageable.class))).thenReturn(page);
        when(auditLogConverter.toDto(log)).thenReturn(dto);

        Page<AuditLogDto> result = auditLogService.list("User", 7L, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
        assertThat(result.getContent().get(0)).isEqualTo(dto);
        verify(auditLogRepository).findByEntityTypeAndEntityId(eq("User"), eq(7L), any(Pageable.class));
        verify(auditLogRepository, never()).findByEntityType(any(), any());
    }

    @Test
    void record_savesEntityThroughRepository() {
        AuditLog log = new AuditLog();
        when(auditLogConverter.toEntity("Template", "CREATE", 1L, 2L, "127.0.0.1")).thenReturn(log);

        auditLogService.record("Template", "CREATE", 1L, 2L, "127.0.0.1");

        verify(auditLogConverter).toEntity("Template", "CREATE", 1L, 2L, "127.0.0.1");
        verify(auditLogRepository).save(log);
    }
}
