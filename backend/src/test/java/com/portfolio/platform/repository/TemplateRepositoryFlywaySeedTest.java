package com.portfolio.platform.repository;

import com.portfolio.platform.model.Template;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Sql("/db/migration/V4__seed_template_categories.sql")
class TemplateRepositoryFlywaySeedTest {

    @Autowired
    TemplateRepository templateRepository;

    @Test
    void seedMigration_insertsExactlyTwentyNineTemplates() {
        assertThat(templateRepository.findAll()).hasSize(29);
    }

    @Test
    void seedMigration_allSlugsAreUnique() {
        List<Template> all = templateRepository.findAll();
        Set<String> slugs = all.stream().map(Template::getSlug).collect(Collectors.toSet());
        assertThat(slugs).hasSize(29);
    }

    @Test
    void seedMigration_allAreActiveWithNullThumbnail() {
        List<Template> all = templateRepository.findAll();
        assertThat(all).allSatisfy(t -> {
            assertThat(t.isActive()).isTrue();
            assertThat(t.getThumbnailMediaId()).isNull();
        });
    }

    @Test
    void seedMigration_displayOrderCoversOneToTwentyNineWithNoGaps() {
        List<Integer> orders = templateRepository.findAll().stream()
                .map(Template::getDisplayOrder)
                .sorted()
                .collect(Collectors.toList());
        List<Integer> expected = IntStream.rangeClosed(1, 29).boxed().collect(Collectors.toList());
        assertThat(orders).isEqualTo(expected);
    }

    @Test
    void seedMigration_slugEqualsSubdomainForEveryRow() {
        assertThat(templateRepository.findAll())
                .allSatisfy(t -> assertThat(t.getSlug()).isEqualTo(t.getSubdomain()));
    }
}
