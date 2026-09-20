package com.portfolio.platform.service;

import com.portfolio.platform.converter.LeadConverter;
import com.portfolio.platform.dto.LeadDto;
import com.portfolio.platform.dto.NewLeadEvent;
import com.portfolio.platform.enums.LeadStatus;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.impl.LeadServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private TemplateRepository templateRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private LeadConverter leadConverter;

    @InjectMocks
    private LeadServiceImpl leadService;

    @Test
    void submit_savesLeadWithNewStatusAndNotifies() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", "0900000000", "Hi", null);
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> {
            Lead l = inv.getArgument(0);
            l.setId(7L);
            return l;
        });

        Long id = leadService.submit(form);

        assertThat(id).isEqualTo(7L);
        ArgumentCaptor<Lead> captor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(LeadStatus.NEW);
        verify(eventPublisher).publishEvent(any(NewLeadEvent.class));
        verifyNoInteractions(templateRepository);
    }

    @Test
    void submit_withUnknownSourceTemplateId_isRejected() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", null, null, 999L);
        when(templateRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> leadService.submit(form))
                .isInstanceOf(InvalidRequestException.class);

        verify(leadRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void submit_withValidSourceTemplateId_savesAndNotifies() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", "0900000000", "Hi", 1L);
        when(templateRepository.existsById(1L)).thenReturn(true);
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> {
            Lead l = inv.getArgument(0);
            l.setId(8L);
            return l;
        });

        Long id = leadService.submit(form);

        assertThat(id).isEqualTo(8L);
        verify(templateRepository).existsById(1L);
        ArgumentCaptor<Lead> captor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(captor.capture());
        assertThat(captor.getValue().getSourceTemplateId()).isEqualTo(1L);
        assertThat(captor.getValue().getStatus()).isEqualTo(LeadStatus.NEW);
        verify(eventPublisher).publishEvent(any(NewLeadEvent.class));
    }

    @Test
    void list_returnsConvertedPage() {
        Lead lead = new Lead();
        lead.setId(10L);
        lead.setName("Test Lead");
        Pageable pageable = PageRequest.of(0, 20);
        Page<Lead> entityPage = new PageImpl<>(List.of(lead), pageable, 1);
        when(leadRepository.findAll(pageable)).thenReturn(entityPage);

        LeadDto dto = new LeadDto(10L, "Test Lead", "test@example.com", null, null, null, LeadStatus.NEW, Instant.now());
        when(leadConverter.toDto(lead)).thenReturn(dto);

        Page<LeadDto> result = leadService.list(pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).containsExactly(dto);
        verify(leadRepository).findAll(pageable);
        verify(leadConverter).toDto(lead);
    }
}

