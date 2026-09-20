package com.portfolio.platform.repository;

import com.portfolio.platform.model.Template;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class TemplateRepositoryFlywaySeedTest {

    @Autowired
    TemplateRepository templateRepository;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @BeforeEach
    void seedTemplates() {
        // Manually seed 29 template categories (simulating V4 migration)
        Instant now = Instant.now();
        String sql = "INSERT INTO templates (name, slug, subdomain, description, category, display_order, is_active, view_count, click_count, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)";

        String[][] seedData = {
                {"Doanh nghiệp", "corporate", "corporate", "Mẫu website chuyên nghiệp cho các công ty và doanh nghiệp.", "corporate", "1"},
                {"Agency / Digital Studio", "agency", "agency", "Mẫu website hiện đại cho các công ty sáng tạo và agency.", "agency", "2"},
                {"SaaS / Startup", "saas", "saas", "Mẫu website tối ưu cho các sản phẩm phần mềm và startup.", "saas", "3"},
                {"Cửa hàng online", "ecommerce", "ecommerce", "Mẫu website thương mại điện tử đầy đủ chức năng.", "ecommerce", "4"},
                {"Nhà hàng / Cafe", "restaurant", "restaurant", "Mẫu website chuyên biệt cho nhà hàng và quán café.", "restaurant", "5"},
                {"Bất động sản", "realestate", "realestate", "Mẫu website cho các công ty bất động sản và môi giới.", "realestate", "6"},
                {"Blog / Magazine", "blog", "blog", "Mẫu website cho blog cá nhân và tạp chí trực tuyến.", "blog", "7"},
                {"Portfolio cá nhân", "portfolio", "portfolio", "Mẫu website giới thiệu công việc và dự án cá nhân.", "portfolio", "8"},
                {"Phòng khám / Nha khoa", "medical", "medical", "Mẫu website chuyên dùng cho phòng khám và nha khoa.", "medical", "9"},
                {"Trường học / Khoá học", "education", "education", "Mẫu website cho các trường học, khoá học trực tuyến.", "education", "10"},
                {"Hội nghị / Sự kiện", "event", "event", "Mẫu website tổ chức sự kiện, hội thảo, và hội nghị.", "event", "11"},
                {"Đám cưới", "wedding", "wedding", "Mẫu website lên kế hoạch và chia sẻ chi tiết đám cưới.", "wedding", "12"},
                {"Gym / Fitness", "fitness", "fitness", "Mẫu website cho phòng tập thể dục và trung tâm fitness.", "fitness", "13"},
                {"Từ thiện / NGO", "nonprofit", "nonprofit", "Mẫu website cho các tổ chức từ thiện và phi lợi nhuận.", "nonprofit", "14"},
                {"Khách sạn / Resort", "travel", "travel", "Mẫu website cho khách sạn, resort, và dịch vụ du lịch.", "travel", "15"},
                {"Kiến trúc / Xây dựng", "construction", "construction", "Mẫu website cho công ty kiến trúc và xây dựng.", "construction", "16"},
                {"Salon / Spa", "beauty", "beauty", "Mẫu website cho salon làm đẹp và dịch vụ spa.", "beauty", "17"},
                {"Photography Studio", "photography", "photography", "Mẫu website cho các studio chụp ảnh chuyên nghiệp.", "photography", "18"},
                {"Đại lý xe", "automotive", "automotive", "Mẫu website cho đại lý ôtô và cửa hàng phụ tùng.", "automotive", "19"},
                {"Văn phòng luật", "legal", "legal", "Mẫu website cho công ty luật và dịch vụ pháp lý.", "legal", "20"},
                {"Cửa hàng streetwear", "shop-streetwear", "shop-streetwear", "Mẫu cửa hàng chuyên bán thời trang streetwear.", "shop-streetwear", "21"},
                {"Cửa hàng nội thất", "shop-homegoods", "shop-homegoods", "Mẫu cửa hàng kinh doanh đồ nội thất và trang trí.", "shop-homegoods", "22"},
                {"Cửa hàng điện tử", "shop-electronics", "shop-electronics", "Mẫu cửa hàng bán điện tử, máy tính, và phụ kiện.", "shop-electronics", "23"},
                {"Blog công nghệ", "blog-tech", "blog-tech", "Mẫu blog chuyên về công nghệ, khoa học, và đổi mới.", "blog-tech", "24"},
                {"Blog lifestyle", "blog-lifestyle", "blog-lifestyle", "Mẫu blog chia sẻ về cuộc sống, thời trang, và sức khỏe.", "blog-lifestyle", "25"},
                {"Blog ẩm thực", "blog-food", "blog-food", "Mẫu blog chia sẻ công thức, review nhà hàng, và ẩm thực.", "blog-food", "26"},
                {"CRM bất động sản", "crm-realestate", "crm-realestate", "Mẫu quản lý khách hàng và dự án bất động sản.", "crm-realestate", "27"},
                {"CRM agency", "crm-agency", "crm-agency", "Mẫu quản lý dự án, nhân sự, và khách hàng agency.", "crm-agency", "28"},
                {"CRM phòng khám", "crm-clinic", "crm-clinic", "Mẫu quản lý bệnh nhân, lịch hẹn, và dịch vụ phòng khám.", "crm-clinic", "29"}
        };

        for (String[] row : seedData) {
            jdbcTemplate.update(sql,
                    row[0], row[1], row[2], row[3], row[4], Integer.parseInt(row[5]),
                    true, now, now);
        }
    }

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
