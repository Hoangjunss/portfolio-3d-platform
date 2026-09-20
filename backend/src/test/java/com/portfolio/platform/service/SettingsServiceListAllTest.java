package com.portfolio.platform.service;

import com.portfolio.platform.constant.SettingKeys;
import com.portfolio.platform.dto.SettingDto;
import com.portfolio.platform.model.Setting;
import com.portfolio.platform.repository.SettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SettingsServiceListAllTest {

    @Autowired
    private SettingsService settingsService;

    @Autowired
    private SettingRepository settingRepository;

    @BeforeEach
    void setUp() {
        settingRepository.deleteAll();
    }

    @Test
    void listAll_returnsOnlyExistingRows_noExceptionForMissingKeys() {
        Setting siteTitle = new Setting();
        siteTitle.setKey(SettingKeys.SITE_TITLE);
        siteTitle.setValueJson("\"Portfolio 3D\"");
        settingRepository.save(siteTitle);
        // contact_email, seo_meta, social_links intentionally have no row yet

        List<SettingDto> result = settingsService.listAll();

        assertThat(result).extracting(SettingDto::key).containsExactly(SettingKeys.SITE_TITLE);
    }

    @Test
    void listAll_returnsEmptyList_onFreshInstall() {
        assertThat(settingsService.listAll()).isEmpty();
    }

    @Test
    void listAll_filtersOutUnrelatedKeys() {
        Setting siteTitle = new Setting();
        siteTitle.setKey(SettingKeys.SITE_TITLE);
        siteTitle.setValueJson("\"Portfolio 3D\"");
        settingRepository.save(siteTitle);

        Setting unrelated = new Setting();
        unrelated.setKey("unrelated_custom_key");
        unrelated.setValueJson("\"Custom Value\"");
        settingRepository.save(unrelated);

        List<SettingDto> result = settingsService.listAll();

        assertThat(result).extracting(SettingDto::key).containsExactly(SettingKeys.SITE_TITLE);
    }
}
