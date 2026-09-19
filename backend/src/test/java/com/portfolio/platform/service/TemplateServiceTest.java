package com.portfolio.platform.service;

import com.portfolio.platform.converter.TemplateConverter;
import com.portfolio.platform.dto.TemplateDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.TemplateUpsertForm;
import com.portfolio.platform.model.Template;
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

        TemplateDto dto = new TemplateDto(1L, "Portfolio 3D", "p3d", "p3d", null, "desc", "cat", "tags", 0, true, 0, 0);
        List<TemplateDto> expectedDtos = List.of(dto);

        when(templateRepository.findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc()).thenReturn(templates);
        when(templateConverter.toDtoList(templates)).thenReturn(expectedDtos);

        List<TemplateDto> result = templateService.listActive();

        assertThat(result).isEqualTo(expectedDtos);
        verify(templateRepository).findByActiveTrueAndDeletedAtIsNullOrderByDisplayOrderAsc();
        verify(templateRepository, never()).findAll();
    }

    @Test
    void incrementClickCount_issuesAtomicUpdate() {
        templateService.incrementClickCount(5L);

        verify(templateRepository).incrementClickCount(5L);
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
