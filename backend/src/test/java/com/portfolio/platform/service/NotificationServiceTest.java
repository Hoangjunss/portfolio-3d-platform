package com.portfolio.platform.service;

import com.portfolio.platform.config.NotificationProperties;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Spy
    private NotificationProperties properties = new NotificationProperties();

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void notifyNewLead_sendsMailToConfiguredRecipient() {
        properties.setLeadRecipient("custom-recipient@example.com");
        properties.setFrom("custom-from@example.com");

        Lead lead = new Lead();
        lead.setId(1L);
        lead.setName("Jane Doe");
        lead.setEmail("jane@example.com");
        lead.setPhone("0123456789");
        lead.setMessage("Interested in 3D portfolio");

        notificationService.notifyNewLead(lead);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();

        assertThat(message.getTo()).containsExactly("custom-recipient@example.com");
        assertThat(message.getFrom()).isEqualTo("custom-from@example.com");
        assertThat(message.getSubject()).contains("Jane Doe");
        assertThat(message.getText()).contains("jane@example.com");
    }

    @Test
    void notifyNewLead_whenMailSenderThrows_doesNotPropagate() {
        Lead lead = new Lead();
        lead.setId(1L);
        lead.setName("Jane Doe");
        lead.setEmail("jane@example.com");

        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> notificationService.notifyNewLead(lead)).doesNotThrowAnyException();
    }
}
