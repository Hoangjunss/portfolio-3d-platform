package com.portfolio.platform.controller;

import com.portfolio.platform.form.LeadCreateForm;
import com.portfolio.platform.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/leads")
public class PublicLeadController {

    private final LeadService leadService;

    public PublicLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    // 202 with no body: the caller gets no lead id back, because the endpoint is unauthenticated.
    @PostMapping
    public ResponseEntity<Void> submit(@Valid @RequestBody LeadCreateForm form) {
        leadService.submit(form);
        return ResponseEntity.accepted().build();
    }
}
