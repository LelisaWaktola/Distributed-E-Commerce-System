package com.distrishop.paymentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DistriShop Payment Service
 *
 * Responsibilities:
 *  - Processing payment transactions for orders
 *  - Persisting payment records for audit trail
 *  - Supporting refund / status lookup
 *
 * Distributed Systems Patterns demonstrated:
 *  - Idempotency: duplicate payment for same orderId is rejected
 *  - Audit trail: all transactions (success/failure) are persisted
 *  - Simulated external gateway: demonstrates abstraction over real payment providers
 *  - CORS and REST API contract consumed by order-service
 */
@SpringBootApplication
public class PaymentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
        System.out.println("================================================");
        System.out.println("  DistriShop Payment Service started on :8084");
        System.out.println("================================================");
    }
}
