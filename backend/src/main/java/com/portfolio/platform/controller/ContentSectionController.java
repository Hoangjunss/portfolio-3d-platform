package com.portfolio.platform.controller;

import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.form.ContentSectionUpsertForm;
import com.portfolio.platform.service.ContentSectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ContentSectionController {

    private final ContentSectionService contentSectionService;

    public ContentSectionController(ContentSectionService contentSectionService) {
        this.contentSectionService = contentSectionService;
    }

    @GetMapping("/api/admin/content-sections")
    public ResponseEntity<List<ContentSectionDto>> listAll() {
        return ResponseEntity.ok(contentSectionService.listAll());
    }

    @GetMapping("/api/public/content-sections/{key}")
    public ResponseEntity<ContentSectionDto> getByKey(@PathVariable("key") String key) {
        return ResponseEntity.ok(contentSectionService.getByKey(key));
    }

    @PutMapping("/api/admin/content-sections/{key}")
    public ResponseEntity<Long> upsert(@PathVariable("key") String key,
                                       @Valid @RequestBody ContentSectionUpsertForm form,
                                       Authentication auth) {
        String username = (auth != null) ? auth.getName() : null;
        Long id = contentSectionService.upsert(key, form, username);
        return ResponseEntity.ok(id);
    }
}
