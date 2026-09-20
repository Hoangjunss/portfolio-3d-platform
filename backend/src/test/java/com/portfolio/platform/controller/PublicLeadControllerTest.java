package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.LeadStatus;
import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicLeadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();
    }

    @Test
    void submit_unauthenticated_returns202AndPersistsLeadWithAuditRow() throws Exception {
        long auditCountBefore = auditLogRepository.count();
        long leadCountBefore = leadRepository.count();

        LeadCreateForm form = new LeadCreateForm(
                "Jane Doe",
                "jane@example.com",
                "0123456789",
                "Hello, I need a portfolio",
                null
        );

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isAccepted());

        assertThat(leadRepository.count()).isEqualTo(leadCountBefore + 1);
        List<Lead> leads = leadRepository.findAll();
        Lead saved = leads.get(leads.size() - 1);
        assertThat(saved.getName()).isEqualTo("Jane Doe");
        assertThat(saved.getEmail()).isEqualTo("jane@example.com");
        assertThat(saved.getPhone()).isEqualTo("0123456789");
        assertThat(saved.getMessage()).isEqualTo("Hello, I need a portfolio");
        assertThat(saved.getStatus()).isEqualTo(LeadStatus.NEW);

        assertThat(auditLogRepository.count()).isEqualTo(auditCountBefore + 1);
        List<AuditLog> auditLogs = auditLogRepository.findAll();
        AuditLog auditLog = auditLogs.get(auditLogs.size() - 1);
        assertThat(auditLog.getEntityType()).isEqualTo("Lead");
        assertThat(auditLog.getAction()).isEqualTo("CREATE");
        assertThat(auditLog.getEntityId()).isEqualTo(saved.getId());
        assertThat(auditLog.getUserId()).isNull();
        verify(notificationService).notifyNewLead(any(Lead.class));
    }

    @Test
    void submit_whenNotificationFails_stillPersistsLead() throws Exception {
        doThrow(new MailSendException("SMTP down")).when(notificationService).notifyNewLead(any());

        LeadCreateForm form = new LeadCreateForm(
                "Jane Doe",
                "jane@example.com",
                "0123456789",
                "Hello, I need a portfolio",
                null
        );

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isAccepted());

        List<Lead> leads = leadRepository.findAll();
        assertThat(leads).hasSize(1);
        assertThat(leads.get(0).getName()).isEqualTo("Jane Doe");
        verify(notificationService).notifyNewLead(any());
    }

    @Test
    void submit_withBlankName_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        LeadCreateForm form = new LeadCreateForm(
                "",
                "jane@example.com",
                "0123456789",
                "Hello",
                null
        );

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    void submit_withOverlongName_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        String overlongName = "A".repeat(300);
        LeadCreateForm form = new LeadCreateForm(
                overlongName,
                "jane@example.com",
                "0123456789",
                "Hello",
                null
        );

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    void submit_withUnknownSourceTemplateId_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        LeadCreateForm form = new LeadCreateForm(
                "Jane Doe",
                "jane@example.com",
                "0123456789",
                "Hello",
                999999L
        );

        mockMvc.perform(post("/api/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Unknown source template"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }
}
