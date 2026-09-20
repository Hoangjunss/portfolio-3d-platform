package com.portfolio.platform.service;

import com.portfolio.platform.converter.TemplateConverter;
import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.Media;
import com.portfolio.platform.model.Template;
import com.portfolio.platform.repository.MediaRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.impl.TemplateServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TemplateServiceTest {

    @Mock
    private TemplateRepository templateRepository;

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private TemplateConverter templateConverter;

    @Mock
    private UserService userService;

    @InjectMocks
    private TemplateServiceImpl templateService;

    @Test
    void listActive_returnsOnlyActiveOrderedTemplates() {
        Template template = new Template();
        template.setId(1L);
        template.setName("Portfolio 3D");
        List<Template> templates = List.of(template);

        TemplateDto dto = new TemplateDto(1L, "Portfolio 3D", "p3d", "p3d", null, null, "desc", "cat", "tags", 0, true, 0, 0);
        List<TemplateDto> expectedDtos = List.of(dto);

        when(templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()).thenReturn(templates);
        when(templateConverter.toDto(template, null)).thenReturn(dto);

        List<TemplateDto> result = templateService.listActive();

        assertThat(result).isEqualTo(expectedDtos);
        verify(templateRepository).findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();
        verify(templateRepository, never()).findAll();
    }

    @Test
    void listActive_resolvesThumbnailUrlFromMediaId() {
        Template template = new Template();
        template.setId(1L);
        template.setName("Portfolio 3D");
        template.setThumbnailMediaId(100L);
        List<Template> templates = List.of(template);

        Media media = new Media();
        media.setId(100L);
        media.setUrl("/media/sample-thumbnail.webp");

        when(templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()).thenReturn(templates);
        when(mediaRepository.findAllById(List.of(100L))).thenReturn(List.of(media));

        TemplateDto expectedDto = new TemplateDto(
                1L, "Portfolio 3D", "p3d", "p3d", 100L, "/media/sample-thumbnail.webp",
                "desc", "cat", "tags", 0, true, 0, 0
        );
        when(templateConverter.toDto(template, "/media/sample-thumbnail.webp")).thenReturn(expectedDto);

        List<TemplateDto> result = templateService.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).thumbnailUrl()).isEqualTo("/media/sample-thumbnail.webp");
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(templateConverter).toDto(eq(template), urlCaptor.capture());
        assertThat(urlCaptor.getValue()).isEqualTo("/media/sample-thumbnail.webp");
    }

    @Test
    void listActive_withNoThumbnail_leavesThumbnailUrlNull() {
        Template template = new Template();
        template.setId(2L);
        template.setName("Portfolio Simple");
        template.setThumbnailMediaId(null);
        List<Template> templates = List.of(template);

        when(templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()).thenReturn(templates);

        TemplateDto expectedDto = new TemplateDto(
                2L, "Portfolio Simple", "psimple", "psimple", null, null,
                "desc", "cat", "tags", 0, true, 0, 0
        );
        when(templateConverter.toDto(template, null)).thenReturn(expectedDto);

        List<TemplateDto> result = templateService.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).thumbnailUrl()).isNull();
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(templateConverter).toDto(eq(template), urlCaptor.capture());
        assertThat(urlCaptor.getValue()).isNull();
    }

    @Test
    void listActive_fetchesMediaInOneQuery() {
        Template t1 = new Template();
        t1.setId(1L);
        t1.setThumbnailMediaId(10L);

        Template t2 = new Template();
        t2.setId(2L);
        t2.setThumbnailMediaId(20L);

        Template t3 = new Template();
        t3.setId(3L);
        t3.setThumbnailMediaId(10L);

        List<Template> templates = List.of(t1, t2, t3);

        Media m1 = new Media();
        m1.setId(10L);
        m1.setUrl("/media/10.webp");

        Media m2 = new Media();
        m2.setId(20L);
        m2.setUrl("/media/20.webp");

        when(templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()).thenReturn(templates);
        when(mediaRepository.findAllById(any())).thenReturn(List.of(m1, m2));

        templateService.listActive();

        verify(mediaRepository, times(1)).findAllById(any());
        verify(mediaRepository, never()).findById(any());
    }

    @Test
    void incrementClickCount_issuesAtomicUpdate() {
        templateService.incrementClickCount(5L);

        verify(templateRepository).incrementClickCount(5L);
        verifyNoMoreInteractions(templateRepository);
    }

    @Test
    void incrementViewCount_issuesAtomicUpdate() {
        templateService.incrementViewCount(5L);

        verify(templateRepository).incrementViewCount(5L);
        verifyNoMoreInteractions(templateRepository);
    }

    @Test
    void update_withUnknownId_throwsResourceNotFound() {
        when(templateRepository.findById(999L)).thenReturn(Optional.empty());
        TemplateUpsertForm form = new TemplateUpsertForm("Name", "slug", "subdomain", null, null, null, null, 0, true);

        assertThatThrownBy(() -> templateService.update(999L, form))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void softDelete_setsDeletedAtAndDeactivates() {
        Template template = new Template();
        template.setId(10L);
        template.setActive(true);
        template.setDeletedAt(null);

        when(templateRepository.findById(10L)).thenReturn(Optional.of(template));
        when(templateRepository.save(template)).thenReturn(template);

        Long deletedId = templateService.softDelete(10L);

        assertThat(deletedId).isEqualTo(10L);

        ArgumentCaptor<Template> captor = ArgumentCaptor.forClass(Template.class);
        verify(templateRepository).save(captor.capture());
        Template saved = captor.getValue();

        assertThat(saved.isActive()).isFalse();
        assertThat(saved.getDeletedAt()).isNotNull();
    }
}
