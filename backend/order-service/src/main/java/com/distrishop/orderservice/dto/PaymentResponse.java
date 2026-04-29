package com.distrishop.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO mirroring the response from payment-service's /api/payments/process endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long paymentId;
    private Long orderId;
    private String transactionId;
    private String status;
    private BigDecimal amount;
    private String message;
}
