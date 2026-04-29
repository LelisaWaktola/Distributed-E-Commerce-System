package com.distrishop.orderservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplate configuration for inter-service HTTP calls.
 *
 * Distributed Systems concern: We set explicit connect and read timeouts
 * to prevent a slow downstream service from blocking all threads (cascade failure).
 * This is a foundational step toward circuit-breaker patterns.
 */
@Configuration
public class RestTemplateConfig {

    @Value("${http.client.connect-timeout:3000}")
    private int connectTimeout;

    @Value("${http.client.read-timeout:5000}")
    private int readTimeout;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeout))
                .setReadTimeout(Duration.ofMillis(readTimeout))
                .build();
    }
}
