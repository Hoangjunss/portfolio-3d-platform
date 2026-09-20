package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "analytics")
public class AnalyticsProperties {

    private String ipHashSecret = "dev-only-analytics-secret-change-me";

    public String getIpHashSecret() {
        return ipHashSecret;
    }

    public void setIpHashSecret(String ipHashSecret) {
        this.ipHashSecret = ipHashSecret;
    }
}
