package com.portfolio.platform.service;

import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.form.SettingUpsertForm;

public interface SettingsService {

    SettingDto get(String key);

    Long set(String key, SettingUpsertForm form, String username);
}
