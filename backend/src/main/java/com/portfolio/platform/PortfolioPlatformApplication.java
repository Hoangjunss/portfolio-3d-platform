package com.portfolio.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
@ConfigurationPropertiesScan
public class PortfolioPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortfolioPlatformApplication.class, args);
    }
}
