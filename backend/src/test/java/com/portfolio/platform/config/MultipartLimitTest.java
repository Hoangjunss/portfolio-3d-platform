package com.portfolio.platform.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.unit.DataSize;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class MultipartLimitTest {

    @Autowired
    private MediaStorageProperties mediaStorageProperties;

    @Value("${spring.servlet.multipart.max-file-size}")
    private DataSize maxFileSize;

    @Test
    void multipartMaxFileSize_mustBeAtLeastMediaMaxSizeBytes() {
        assertThat(maxFileSize.toBytes()).isGreaterThanOrEqualTo(mediaStorageProperties.getMaxSizeBytes());
    }
}
