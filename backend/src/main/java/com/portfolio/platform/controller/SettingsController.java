package com.portfolio.platform.controller;

import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.form.SettingUpsertForm;
import com.portfolio.platform.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<List<SettingDto>> listAll() {
        return ResponseEntity.ok(settingsService.listAll());
    }

    @GetMapping("/{key}")
    public ResponseEntity<SettingDto> get(@PathVariable("key") String key) {
        return ResponseEntity.ok(settingsService.get(key));
    }

    @PutMapping("/{key}")
    public ResponseEntity<Long> set(@PathVariable("key") String key,
                                    @Valid @RequestBody SettingUpsertForm form,
                                    Authentication auth) {
        String username = (auth != null) ? auth.getName() : null;
        Long id = settingsService.set(key, form, username);
        return ResponseEntity.ok(id);
    }
}
