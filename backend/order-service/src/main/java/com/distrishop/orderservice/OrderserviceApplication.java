package com.distrishop.orderservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DistriShop Order Service
 *
 * Responsibilities:
 *  - Shopping cart management (add/remove/view items)
 *  - Order creation and lifecycle
 *  - Orchestrating payment via payment-service
 *
 * Distributed Systems Patterns demonstrated:
 *  1. Synchronous inter-service calls via RestTemplate (orchestrator pattern)
 *  2. Fault tolerance: 503 fallback when product-service or payment-service is down
 *  3. Circuit breaker intent: connection timeouts prevent cascade failures
 *  4. Saga pattern intent: order creation is an orchestrated multi-step transaction
 */
@SpringBootApplication
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
        System.out.println("=============================================");
        System.out.println("  DistriShop Order Service started on :8083");
        System.out.println("  Downstream: product-service:8082");
        System.out.println("  Downstream: payment-service:8084");
        System.out.println("=============================================");
    }
}
