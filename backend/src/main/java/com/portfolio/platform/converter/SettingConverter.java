package com.portfolio.platform.converter;

import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.model.Setting;

public interface SettingConverter {

    SettingDto toDto(Setting setting);
}
