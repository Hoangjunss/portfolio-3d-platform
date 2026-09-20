package com.portfolio.platform.service;

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
    private NotificationService notificationService;

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
        verify(notificationService).notifyNewLead(captor.getValue());
        verifyNoInteractions(templateRepository);
    }

    @Test
    void submit_withUnknownSourceTemplateId_isRejected() {
        LeadCreateForm form = new LeadCreateForm("Jane", "jane@example.com", null, null, 999L);
        when(templateRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> leadService.submit(form))
                .isInstanceOf(InvalidRequestException.class);

        verify(leadRepository, never()).save(any());
        verifyNoInteractions(notificationService);
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
        verify(notificationService).notifyNewLead(captor.getValue());
    }
}
