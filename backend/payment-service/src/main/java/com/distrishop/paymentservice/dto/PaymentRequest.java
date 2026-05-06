package com.distrishop.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Incoming payment request from order-service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String currency;
}
