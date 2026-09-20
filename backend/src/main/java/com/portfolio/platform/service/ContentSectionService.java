package com.portfolio.platform.service;

import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.form.ContentSectionUpsertForm;

import java.util.List;

public interface ContentSectionService {

    List<ContentSectionDto> listAll();

    ContentSectionDto getByKey(String sectionKey);

    Long upsert(String sectionKey, ContentSectionUpsertForm form, String username);
}
