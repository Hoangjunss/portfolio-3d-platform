package com.portfolio.platform.controller;

import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.service.TemplateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/templates")
public class AdminTemplateController {

    private final TemplateService templateService;

    public AdminTemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<TemplateDto> listAll() {
        return templateService.listAllForAdmin();
    }

    @PostMapping
    public ResponseEntity<Long> create(@Valid @RequestBody TemplateUpsertForm form, Authentication auth) {
        String username = (auth != null) ? auth.getName() : null;
        Long id = templateService.create(form, username);
        return ResponseEntity.ok(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Long> update(@PathVariable Long id, @Valid @RequestBody TemplateUpsertForm form) {
        Long updatedId = templateService.update(id, form);
        return ResponseEntity.ok(updatedId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Long> delete(@PathVariable Long id) {
        Long deletedId = templateService.softDelete(id);
        return ResponseEntity.ok(deletedId);
    }
}
