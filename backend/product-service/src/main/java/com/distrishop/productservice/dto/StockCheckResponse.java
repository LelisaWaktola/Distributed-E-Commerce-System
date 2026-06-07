package com.distrishop.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response for the stock check endpoint consumed by order-service.
 * Demonstrates the API contract between microservices.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockCheckResponse {
    private Long productId;
    private String productName;
    private Integer availableStock;
    private boolean inStock;
    private String status;
    private BigDecimal price;
}
