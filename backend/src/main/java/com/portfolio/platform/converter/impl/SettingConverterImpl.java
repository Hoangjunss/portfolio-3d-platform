package com.portfolio.platform.converter.impl;

import com.portfolio.platform.converter.SettingConverter;
import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.model.Setting;
import org.springframework.stereotype.Component;

@Component
public class SettingConverterImpl implements SettingConverter {

    @Override
    public SettingDto toDto(Setting setting) {
        if (setting == null) {
            return null;
        }
        return new SettingDto(
                setting.getKey(),
                setting.getValueJson(),
                setting.getUpdatedAt()
        );
    }
}
