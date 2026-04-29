package com.distrishop.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private Long userId;
    private String shippingAddress;
    private String notes;
    /** Payment method to pass to payment-service (e.g. "CREDIT_CARD", "PAYPAL") */
    private String paymentMethod;
}
