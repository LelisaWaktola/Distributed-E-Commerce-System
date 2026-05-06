package com.distrishop.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long paymentId;
    private Long orderId;
    private Long userId;
    private String transactionId;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String message;
    private LocalDateTime processedAt;
}
