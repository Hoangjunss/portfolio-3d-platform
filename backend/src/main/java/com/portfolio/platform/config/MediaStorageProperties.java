package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "media")
public class MediaStorageProperties {

    private String uploadDir = "/data/media";
    private long maxSizeBytes = 10L * 1024 * 1024; // 10MB default
    // SVG is deliberately excluded: it is executable XML and serving it from the portfolio origin is stored XSS.
    private List<String> allowedContentTypes = List.of("image/png", "image/jpeg", "image/webp", "image/gif");

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public long getMaxSizeBytes() {
        return maxSizeBytes;
    }

    public void setMaxSizeBytes(long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public List<String> getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(List<String> allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }
}
