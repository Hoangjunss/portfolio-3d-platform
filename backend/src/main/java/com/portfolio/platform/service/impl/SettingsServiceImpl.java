package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.constant.SettingKeys;
import com.portfolio.platform.converter.SettingConverter;
import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.SettingUpsertForm;
import com.portfolio.platform.model.Setting;
import com.portfolio.platform.repository.SettingRepository;
import com.portfolio.platform.service.SettingsService;
import com.portfolio.platform.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SettingsServiceImpl implements SettingsService {

    private final SettingRepository settingRepository;
    private final SettingConverter settingConverter;
    private final UserService userService;

    public SettingsServiceImpl(SettingRepository settingRepository,
                               SettingConverter settingConverter,
                               UserService userService) {
        this.settingRepository = settingRepository;
        this.settingConverter = settingConverter;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<SettingDto> listAll() {
        return settingRepository.findAllByKeyIn(SettingKeys.ALL).stream()
                .map(settingConverter::toDto)
                .toList();
    }

    // Settings are not cached: read rarely by admin flows requiring immediate consistency.
    @Transactional(readOnly = true)
    @Override
    public SettingDto get(String key) {
        Setting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting", key));
        return settingConverter.toDto(setting);
    }

    // Returns entity ID as Long so AuditAspect can populate audit_logs.entity_id.
    @Audited(entityType = "Setting", action = "UPDATE")
    @Transactional
    @Override
    public Long set(String key, SettingUpsertForm form, String username) {
        Long updatedBy = username != null ? userService.findIdByUsername(username).orElse(null) : null;
        Setting setting = settingRepository.findByKey(key)
                .map(existing -> {
                    existing.setValueJson(form.valueJson());
                    return existing;
                })
                .orElseGet(() -> {
                    Setting created = new Setting();
                    created.setKey(key);
                    created.setValueJson(form.valueJson());
                    return created;
                });

        setting.setUpdatedBy(updatedBy);
        Setting saved = settingRepository.save(setting);
        return saved.getId();
    }
}
