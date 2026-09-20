package com.portfolio.platform.controller;

import com.portfolio.platform.model.Media;
import com.portfolio.platform.model.Template;
import com.portfolio.platform.repository.MediaRepository;
import com.portfolio.platform.repository.TemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private org.springframework.cache.CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        templateRepository.deleteAll();
        mediaRepository.deleteAll();
        if (cacheManager != null && cacheManager.getCache("public-templates") != null) {
            cacheManager.getCache("public-templates").clear();
        }
    }

    @Test
    void listActive_returnsOnlyActiveAndNotDeletedTemplates() throws Exception {
        Template active = new Template();
        active.setName("Active Template");
        active.setSlug("active-template");
        active.setSubdomain("active");
        active.setActive(true);
        active.setDisplayOrder(1);
        templateRepository.save(active);

        Template inactive = new Template();
        inactive.setName("Inactive Template");
        inactive.setSlug("inactive-template");
        inactive.setSubdomain("inactive");
        inactive.setActive(false);
        inactive.setDisplayOrder(2);
        templateRepository.save(inactive);

        Template softDeleted = new Template();
        softDeleted.setName("Deleted Template");
        softDeleted.setSlug("deleted-template");
        softDeleted.setSubdomain("deleted");
        softDeleted.setActive(true);
        softDeleted.setDeletedAt(Instant.now());
        softDeleted.setDisplayOrder(3);
        templateRepository.save(softDeleted);

        String responseBody = mockMvc.perform(get("/api/public/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].slug").value("active-template"))
                .andReturn().getResponse().getContentAsString();

        assertThat(responseBody)
                .contains("active-template")
                .doesNotContain("inactive-template")
                .doesNotContain("deleted-template");
    }

    @Test
    void listActive_carriesThumbnailUrlInJson() throws Exception {
        Media media = new Media();
        media.setFileName("preview.webp");
        media.setUrl("/media/preview.webp");
        media.setMimeType("image/webp");
        media.setSizeBytes(2048);
        Media savedMedia = mediaRepository.save(media);

        Template template = new Template();
        template.setName("Active Template With Thumbnail");
        template.setSlug("active-thumb");
        template.setSubdomain("active-thumb");
        template.setThumbnailMediaId(savedMedia.getId());
        template.setActive(true);
        template.setDisplayOrder(1);
        templateRepository.save(template);

        mockMvc.perform(get("/api/public/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].slug").value("active-thumb"))
                .andExpect(jsonPath("$[0].thumbnailMediaId").value(savedMedia.getId()))
                .andExpect(jsonPath("$[0].thumbnailUrl").value("/media/preview.webp"));
    }
}
