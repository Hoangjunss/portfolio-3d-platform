package com.portfolio.platform.service.impl;

import com.portfolio.platform.config.NotificationProperties;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final JavaMailSender mailSender;
    private final NotificationProperties properties;

    public NotificationServiceImpl(JavaMailSender mailSender, NotificationProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void notifyNewLead(Lead lead) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(properties.getFrom());
            message.setTo(properties.getLeadRecipient());
            message.setSubject("New lead: " + lead.getName());
            message.setText("Name: " + lead.getName() + "\n"
                    + "Email: " + lead.getEmail() + "\n"
                    + "Phone: " + (lead.getPhone() != null ? lead.getPhone() : "N/A") + "\n"
                    + "Message: " + (lead.getMessage() != null ? lead.getMessage() : "N/A"));
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Failed to send new lead notification email for lead id: {}", lead.getId(), e);
        }
    }
}
