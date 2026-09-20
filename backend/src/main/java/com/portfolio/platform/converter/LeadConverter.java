package com.portfolio.platform.converter;

import com.portfolio.platform.dto.LeadDto;
import com.portfolio.platform.model.Lead;

public interface LeadConverter {

    LeadDto toDto(Lead lead);
}
