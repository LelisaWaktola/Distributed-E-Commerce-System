package com.distrishop.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO mirroring the response from product-service's /api/products/stock/check/{id}.
 * Kept here as a local contract type for deserialization.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponse {
    private Long productId;
    private String productName;
    private Integer availableStock;
    private boolean inStock;
    private String status;
}
