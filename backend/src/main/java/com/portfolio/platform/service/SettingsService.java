package com.portfolio.platform.service;

import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.form.SettingUpsertForm;

import java.util.List;

public interface SettingsService {

    List<SettingDto> listAll();

    SettingDto get(String key);

    Long set(String key, SettingUpsertForm form, String username);
}
