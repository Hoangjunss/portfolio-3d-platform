package com.portfolio.platform.controller;

import com.portfolio.platform.dto.LeadDto;
import com.portfolio.platform.service.LeadService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/leads")
public class AdminLeadController {

    private final LeadService leadService;

    public AdminLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    public ResponseEntity<Page<LeadDto>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(leadService.list(pageable));
    }
}

