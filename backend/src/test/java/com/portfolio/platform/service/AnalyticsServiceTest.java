package com.portfolio.platform.service;

import com.portfolio.platform.config.AnalyticsProperties;
import com.portfolio.platform.dto.AnalyticsSummaryDto;
import com.portfolio.platform.dto.TemplateClickCountDto;
import com.portfolio.platform.enums.AnalyticsEventType;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.form.TrackEventForm;
import com.portfolio.platform.model.AnalyticsEvent;
import com.portfolio.platform.repository.AnalyticsEventRepository;
import com.portfolio.platform.repository.TemplateRepository;
import com.portfolio.platform.service.impl.AnalyticsServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @Mock
    private TemplateRepository templateRepository;

    @Mock
    private TemplateService templateService;

    @Spy
    private AnalyticsProperties analyticsProperties = new AnalyticsProperties();

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    @Test
    void track_templateClick_persistsEventAndIncrementsClickCount() {
        when(templateRepository.existsById(7L)).thenReturn(true);
        TrackEventForm form = new TrackEventForm(AnalyticsEventType.TEMPLATE_CLICK, 7L, "session-1");

        analyticsService.track(form, "192.168.1.1", "Mozilla/5.0", "https://example.com");

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository).save(captor.capture());
        AnalyticsEvent saved = captor.getValue();

        assertThat(saved.getEventType()).isEqualTo(AnalyticsEventType.TEMPLATE_CLICK);
        assertThat(saved.getTemplateId()).isEqualTo(7L);
        assertThat(saved.getSessionId()).isEqualTo("session-1");
        assertThat(saved.getIpHash()).isNotEqualTo("192.168.1.1");
        assertThat(saved.getIpHash()).isNotBlank();
        assertThat(saved.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(saved.getReferrer()).isEqualTo("https://example.com");

        verify(templateService).incrementClickCount(7L);
        verify(templateService, never()).incrementViewCount(any());
    }

    @Test
    void track_pageView_incrementsViewCount() {
        when(templateRepository.existsById(7L)).thenReturn(true);
        TrackEventForm form = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, 7L, "session-1");

        analyticsService.track(form, "192.168.1.1", "Mozilla/5.0", null);

        verify(templateService).incrementViewCount(7L);
        verify(templateService, never()).incrementClickCount(any());
    }

    @Test
    void track_withoutTemplateId_persistsEventAndTouchesNoTemplate() {
        TrackEventForm form = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, null, "session-1");

        analyticsService.track(form, "192.168.1.1", "Mozilla/5.0", null);

        verify(analyticsEventRepository).save(any(AnalyticsEvent.class));
        verifyNoInteractions(templateService);
        verifyNoInteractions(templateRepository);
    }

    @Test
    void track_withUnknownTemplateId_isRejected() {
        when(templateRepository.existsById(999L)).thenReturn(false);
        TrackEventForm form = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, 999L, "session-1");

        assertThatThrownBy(() -> analyticsService.track(form, "192.168.1.1", "Mozilla/5.0", null))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessage("Unknown template");

        verifyNoInteractions(analyticsEventRepository);
        verifyNoInteractions(templateService);
    }

    @Test
    void track_hashesSameIpToSameValueAndDifferentIpsDifferently() {
        TrackEventForm form1 = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, null, "sess-1");
        TrackEventForm form2 = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, null, "sess-2");
        TrackEventForm form3 = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, null, "sess-3");
        TrackEventForm form4 = new TrackEventForm(AnalyticsEventType.PAGE_VIEW, null, "sess-4");

        analyticsService.track(form1, "1.2.3.4", "UA", null);
        analyticsService.track(form2, "1.2.3.4", "UA", null);
        analyticsService.track(form3, "5.6.7.8", "UA", null);

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository, times(3)).save(captor.capture());
        List<AnalyticsEvent> events = captor.getAllValues();

        String hashIp1A = events.get(0).getIpHash();
        String hashIp1B = events.get(1).getIpHash();
        String hashIp2 = events.get(2).getIpHash();

        assertThat(hashIp1A).isEqualTo(hashIp1B);
        assertThat(hashIp1A).isNotEqualTo(hashIp2);

        // Prove the HMAC key is actually in the digest rather than decorative:
        // changing the secret must change the hash for the exact same IP.
        analyticsProperties.setIpHashSecret("different-secret-key-999");
        analyticsService.track(form4, "1.2.3.4", "UA", null);

        verify(analyticsEventRepository, times(4)).save(captor.capture());
        String hashIp1DifferentSecret = captor.getValue().getIpHash();

        assertThat(hashIp1DifferentSecret).isNotEqualTo(hashIp1A);
        assertThat(hashIp1DifferentSecret).isNotBlank();
    }

    @Test
    void track_truncatesOverlongUserAgent() {
        String overlongUa = "A".repeat(600);
        String overlongReferrer = "B".repeat(1200);
        TrackEventForm form = new TrackEventForm(AnalyticsEventType.DEMO_OPEN, null, "session-1");

        analyticsService.track(form, "1.2.3.4", overlongUa, overlongReferrer);

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository).save(captor.capture());
        AnalyticsEvent saved = captor.getValue();

        assertThat(saved.getUserAgent()).hasSize(512);
        assertThat(saved.getUserAgent()).isEqualTo("A".repeat(512));
        assertThat(saved.getReferrer()).hasSize(1024);
        assertThat(saved.getReferrer()).isEqualTo("B".repeat(1024));
    }

    @Test
    void summary_returnsCountsAndTopTemplates() {
        when(analyticsEventRepository.countByEventType(AnalyticsEventType.PAGE_VIEW)).thenReturn(150L);
        when(analyticsEventRepository.countByEventType(AnalyticsEventType.TEMPLATE_CLICK)).thenReturn(45L);
        List<TemplateClickCountDto> topTemplates = List.of(
                new TemplateClickCountDto(1L, 30L),
                new TemplateClickCountDto(2L, 15L)
        );
        when(analyticsEventRepository.topClickedTemplates(any(Pageable.class))).thenReturn(topTemplates);

        AnalyticsSummaryDto summary = analyticsService.summary();

        assertThat(summary.totalViews()).isEqualTo(150L);
        assertThat(summary.totalClicks()).isEqualTo(45L);
        assertThat(summary.topTemplates()).isEqualTo(topTemplates);
    }
}
