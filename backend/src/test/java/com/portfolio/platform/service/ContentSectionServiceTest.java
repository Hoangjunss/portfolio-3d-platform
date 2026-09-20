package com.portfolio.platform.service;

import com.portfolio.platform.converter.ContentSectionConverter;
import com.portfolio.platform.dto.ContentSectionDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.ContentSectionUpsertForm;
import com.portfolio.platform.model.ContentSection;
import com.portfolio.platform.repository.ContentSectionRepository;
import com.portfolio.platform.service.impl.ContentSectionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentSectionServiceTest {

    @Mock
    private ContentSectionRepository contentSectionRepository;

    @Mock
    private ContentSectionConverter contentSectionConverter;

    @Mock
    private UserService userService;

    @InjectMocks
    private ContentSectionServiceImpl contentSectionService;

    @Test
    void listAll_returnsEveryContentSectionAsDto() {
        ContentSection hero = new ContentSection();
        hero.setId(1L);
        hero.setSectionKey("hero");
        hero.setDataJson("{\"headline\":\"See your site before you build it.\"}");
        hero.setVersion(1);

        ContentSectionDto heroDto = new ContentSectionDto("hero", "{\"headline\":\"See your site before you build it.\"}", 1, Instant.now());

        when(contentSectionRepository.findAll()).thenReturn(List.of(hero));
        when(contentSectionConverter.toDto(hero)).thenReturn(heroDto);

        List<ContentSectionDto> result = contentSectionService.listAll();

        assertThat(result).containsExactly(heroDto);
    }

    @Test
    void getByKey_returnsDto() {
        ContentSection section = new ContentSection();
        section.setId(1L);
        section.setSectionKey("hero");
        section.setDataJson("{\"title\":\"Hello\"}");
        section.setVersion(1);

        ContentSectionDto expectedDto = new ContentSectionDto("hero", "{\"title\":\"Hello\"}", 1, Instant.now());

        when(contentSectionRepository.findBySectionKey("hero")).thenReturn(Optional.of(section));
        when(contentSectionConverter.toDto(section)).thenReturn(expectedDto);

        ContentSectionDto result = contentSectionService.getByKey("hero");

        assertThat(result).isEqualTo(expectedDto);
    }

    @Test
    void getByKey_whenMissing_throwsResourceNotFound() {
        when(contentSectionRepository.findBySectionKey("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contentSectionService.getByKey("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("missing");
    }

    @Test
    void upsert_whenAbsent_createsWithVersionOne() {
        when(contentSectionRepository.findBySectionKey("about")).thenReturn(Optional.empty());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(42L));
        when(contentSectionRepository.save(any(ContentSection.class))).thenAnswer(inv -> {
            ContentSection cs = inv.getArgument(0);
            cs.setId(100L);
            return cs;
        });

        ContentSectionUpsertForm form = new ContentSectionUpsertForm("{\"bio\":\"Dev\"}");
        Long id = contentSectionService.upsert("about", form, "admin");

        assertThat(id).isEqualTo(100L);

        ArgumentCaptor<ContentSection> captor = ArgumentCaptor.forClass(ContentSection.class);
        verify(contentSectionRepository).save(captor.capture());
        ContentSection saved = captor.getValue();

        assertThat(saved.getSectionKey()).isEqualTo("about");
        assertThat(saved.getDataJson()).isEqualTo("{\"bio\":\"Dev\"}");
        assertThat(saved.getVersion()).isEqualTo(1);
        assertThat(saved.getUpdatedBy()).isEqualTo(42L);
    }

    @Test
    void upsert_whenPresent_incrementsVersion() {
        ContentSection existing = new ContentSection();
        existing.setId(5L);
        existing.setSectionKey("about");
        existing.setDataJson("{\"bio\":\"Old\"}");
        existing.setVersion(1);

        when(contentSectionRepository.findBySectionKey("about")).thenReturn(Optional.of(existing));
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(42L));
        when(contentSectionRepository.save(existing)).thenReturn(existing);

        ContentSectionUpsertForm form = new ContentSectionUpsertForm("{\"bio\":\"New\"}");
        Long id = contentSectionService.upsert("about", form, "admin");

        assertThat(id).isEqualTo(5L);

        ArgumentCaptor<ContentSection> captor = ArgumentCaptor.forClass(ContentSection.class);
        verify(contentSectionRepository).save(captor.capture());
        ContentSection saved = captor.getValue();

        assertThat(saved.getSectionKey()).isEqualTo("about");
        assertThat(saved.getDataJson()).isEqualTo("{\"bio\":\"New\"}");
        assertThat(saved.getVersion()).isEqualTo(2);
        assertThat(saved.getUpdatedBy()).isEqualTo(42L);
    }
}
