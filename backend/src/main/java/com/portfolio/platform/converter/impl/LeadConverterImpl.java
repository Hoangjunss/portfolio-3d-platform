package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.LeadConverter;
import com.portfolio.platform.dto.LeadDto;
import com.portfolio.platform.model.Lead;
import org.springframework.stereotype.Component;

@Component
public class LeadConverterImpl implements LeadConverter {

    @Override
    public LeadDto toDto(Lead lead) {
        if (lead == null) {
            return null;
        }
        return new LeadDto(
                lead.getId(),
                lead.getName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getMessage(),
                lead.getSourceTemplateId(),
                lead.getStatus(),
                lead.getCreatedAt()
        );
    }
}
