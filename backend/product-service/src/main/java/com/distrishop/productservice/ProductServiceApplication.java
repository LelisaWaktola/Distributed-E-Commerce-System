package com.distrishop.productservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * DistriShop Product Service
 *
 * Responsibilities:
 *  - Product catalog management (CRUD)
 *  - Category hierarchy management
 *  - Inventory / stock level tracking
 *  - Product reviews
 *
 * Distributed Systems Patterns demonstrated:
 *  - Service-specific database schema (products, categories, product_reviews)
 *  - Stock-check endpoint consumed by order-service (inter-service synchronous call)
 *  - Slug-based URL routing for SEO-friendly product lookup
 */
@SpringBootApplication
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
        System.out.println("==============================================");
        System.out.println("  DistriShop Product Service started on :8082");
        System.out.println("==============================================");
    }
}
