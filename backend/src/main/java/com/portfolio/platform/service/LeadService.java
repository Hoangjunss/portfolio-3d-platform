package com.portfolio.platform.service;

import com.portfolio.platform.dto.LeadDto;
import com.portfolio.platform.form.LeadCreateForm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LeadService {

    Long submit(LeadCreateForm form);

    Page<LeadDto> list(Pageable pageable);
}

