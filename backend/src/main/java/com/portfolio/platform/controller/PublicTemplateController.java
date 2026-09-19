package com.portfolio.platform.controller;

import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.service.TemplateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/templates")
public class PublicTemplateController {

    private final TemplateService templateService;

    public PublicTemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateDto> listActive() {
        return templateService.listActive();
    }
}
