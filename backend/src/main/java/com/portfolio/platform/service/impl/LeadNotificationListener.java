package com.portfolio.platform.service.impl;

import com.portfolio.platform.dto.NewLeadEvent;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class LeadNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(LeadNotificationListener.class);

    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    public LeadNotificationListener(LeadRepository leadRepository, NotificationService notificationService) {
        this.leadRepository = leadRepository;
        this.notificationService = notificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNewLead(NewLeadEvent event) {
        leadRepository.findById(event.leadId()).ifPresentOrElse(
                lead -> {
                    try {
                        notificationService.notifyNewLead(lead);
                    } catch (Exception e) {
                        log.error("Failed to notify new lead for lead id: {}", event.leadId(), e);
                    }
                },
                () -> log.warn("Lead not found for notification with id: {}", event.leadId())
        );
    }
}
