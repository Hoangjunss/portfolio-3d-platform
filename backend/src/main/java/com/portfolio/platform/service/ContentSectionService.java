package com.portfolio.platform.service;

import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.form.ContentSectionUpsertForm;

public interface ContentSectionService {

    ContentSectionDto getByKey(String sectionKey);

    Long upsert(String sectionKey, ContentSectionUpsertForm form, String username);
}
