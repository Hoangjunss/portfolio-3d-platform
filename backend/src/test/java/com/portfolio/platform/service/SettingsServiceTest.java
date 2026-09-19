package com.portfolio.platform.service;

import com.portfolio.platform.converter.SettingConverter;
import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.SettingUpsertForm;
import com.portfolio.platform.model.Setting;
import com.portfolio.platform.repository.SettingRepository;
import com.portfolio.platform.service.impl.SettingsServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private SettingRepository settingRepository;

    @Mock
    private SettingConverter settingConverter;

    @Mock
    private UserService userService;

    @InjectMocks
    private SettingsServiceImpl settingsService;

    @Test
    void get_returnsDto() {
        Setting setting = new Setting();
        setting.setId(1L);
        setting.setKey("site_title");
        setting.setValueJson("\"My Portfolio\"");

        SettingDto expectedDto = new SettingDto("site_title", "\"My Portfolio\"", Instant.now());

        when(settingRepository.findByKey("site_title")).thenReturn(Optional.of(setting));
        when(settingConverter.toDto(setting)).thenReturn(expectedDto);

        SettingDto result = settingsService.get("site_title");

        assertThat(result).isEqualTo(expectedDto);
    }

    @Test
    void get_whenMissing_throwsResourceNotFound() {
        when(settingRepository.findByKey("missing_key")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> settingsService.get("missing_key"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing_key");
    }

    @Test
    void set_whenAbsent_creates() {
        when(settingRepository.findByKey("contact_email")).thenReturn(Optional.empty());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(settingRepository.save(any(Setting.class))).thenAnswer(inv -> {
            Setting s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        SettingUpsertForm form = new SettingUpsertForm("\"admin@example.com\"");
        Long id = settingsService.set("contact_email", form, "admin");

        assertThat(id).isEqualTo(10L);

        ArgumentCaptor<Setting> captor = ArgumentCaptor.forClass(Setting.class);
        verify(settingRepository).save(captor.capture());
        Setting saved = captor.getValue();

        assertThat(saved.getKey()).isEqualTo("contact_email");
        assertThat(saved.getValueJson()).isEqualTo("\"admin@example.com\"");
        assertThat(saved.getUpdatedBy()).isEqualTo(1L);
    }

    @Test
    void set_whenPresent_updatesAndKeepsKey() {
        Setting existing = new Setting();
        existing.setId(5L);
        existing.setKey("site_title");
        existing.setValueJson("\"Old Title\"");

        when(settingRepository.findByKey("site_title")).thenReturn(Optional.of(existing));
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(settingRepository.save(existing)).thenReturn(existing);

        SettingUpsertForm form = new SettingUpsertForm("\"New Title\"");
        Long id = settingsService.set("site_title", form, "admin");

        assertThat(id).isEqualTo(5L);

        ArgumentCaptor<Setting> captor = ArgumentCaptor.forClass(Setting.class);
        verify(settingRepository).save(captor.capture());
        Setting saved = captor.getValue();

        assertThat(saved.getKey()).isEqualTo("site_title");
        assertThat(saved.getValueJson()).isEqualTo("\"New Title\"");
        assertThat(saved.getUpdatedBy()).isEqualTo(1L);
    }

    @Test
    void set_persistsUpdatedBy() {
        when(settingRepository.findByKey("theme")).thenReturn(Optional.empty());
        when(userService.findIdByUsername("superadmin")).thenReturn(Optional.of(88L));
        when(settingRepository.save(any(Setting.class))).thenAnswer(inv -> {
            Setting s = inv.getArgument(0);
            s.setId(20L);
            return s;
        });

        SettingUpsertForm form = new SettingUpsertForm("\"dark\"");
        Long id = settingsService.set("theme", form, "superadmin");

        assertThat(id).isEqualTo(20L);

        ArgumentCaptor<Setting> captor = ArgumentCaptor.forClass(Setting.class);
        verify(settingRepository).save(captor.capture());
        Setting saved = captor.getValue();

        assertThat(saved.getUpdatedBy()).isEqualTo(88L);
    }
}
