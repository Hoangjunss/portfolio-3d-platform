package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.dto.NewLeadEvent;
import com.portfolio.platform.enums.LeadStatus;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.LeadService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeadServiceImpl implements LeadService {

    private final LeadRepository leadRepository;
    private final TemplateRepository templateRepository;
    private final ApplicationEventPublisher eventPublisher;

    public LeadServiceImpl(LeadRepository leadRepository,
                           TemplateRepository templateRepository,
                           ApplicationEventPublisher eventPublisher) {
        this.leadRepository = leadRepository;
        this.templateRepository = templateRepository;
        this.eventPublisher = eventPublisher;
    }

    @Audited(entityType = "Lead", action = "CREATE")
    @Transactional
    @Override
    public Long submit(LeadCreateForm form) {
        if (form.sourceTemplateId() != null && !templateRepository.existsById(form.sourceTemplateId())) {
            // Checked here rather than left to the FK: a violation would surface as a 500 and a
            // system_error_logs row written by an anonymous caller.
            throw new InvalidRequestException("Unknown source template");
        }

        Lead lead = new Lead();
        lead.setName(form.name());
        lead.setEmail(form.email());
        lead.setPhone(form.phone());
        lead.setMessage(form.message());
        lead.setSourceTemplateId(form.sourceTemplateId());
        lead.setStatus(LeadStatus.NEW);

        Lead saved = leadRepository.save(lead);
        eventPublisher.publishEvent(new NewLeadEvent(saved.getId()));
        return saved.getId();
    }
}
