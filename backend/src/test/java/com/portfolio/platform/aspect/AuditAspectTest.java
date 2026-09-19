package com.portfolio.platform.aspect;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditAspectTest {

    static class SampleService {
        @Audited(entityType = "Sample", action = "CREATE")
        public Long doCreate(Long entityId) {
            return entityId;
        }
    }

    @TestConfiguration
    static class Beans {
        @Bean
        SampleService sampleService() {
            return new SampleService();
        }
    }

    @Autowired SampleService sampleService;
    @Autowired AuditLogRepository auditLogRepository;

    @Test
    void auditedMethod_writesExactlyOneAuditLog() {
        long before = auditLogRepository.count();

        sampleService.doCreate(42L);

        assertThat(auditLogRepository.count()).isEqualTo(before + 1);
        var row = auditLogRepository.findAll().get((int) before);
        assertThat(row.getEntityType()).isEqualTo("Sample");
        assertThat(row.getAction()).isEqualTo("CREATE");
        assertThat(row.getEntityId()).isEqualTo(42L);
    }
}
