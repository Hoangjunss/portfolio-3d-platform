package com.portfolio.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class PortfolioPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortfolioPlatformApplication.class, args);
    }
}
