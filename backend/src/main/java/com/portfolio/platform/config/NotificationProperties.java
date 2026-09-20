package com.portfolio.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notification")
public class NotificationProperties {

    private String leadRecipient = "sales@portfolio.com";
    private String from = "no-reply@portfolio.com";

    public String getLeadRecipient() {
        return leadRecipient;
    }

    public void setLeadRecipient(String leadRecipient) {
        this.leadRecipient = leadRecipient;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }
}
