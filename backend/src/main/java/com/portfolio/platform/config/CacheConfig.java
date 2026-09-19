package com.portfolio.platform.config;

import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;

import java.time.Duration;

@Configuration
public class CacheConfig {

    // 5-minute TTL balances admin edit latency against origin load until traffic patterns are measured.
    private static final Duration PUBLIC_CACHE_TTL = Duration.ofMinutes(5);

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(PUBLIC_CACHE_TTL);
        return builder -> builder
                .withCacheConfiguration("public-templates", cacheConfig)
                .withCacheConfiguration("content-sections", cacheConfig);
    }
}
