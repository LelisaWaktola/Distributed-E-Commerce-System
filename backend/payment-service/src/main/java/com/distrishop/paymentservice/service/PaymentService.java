package com.distrishop.paymentservice.service;

import com.distrishop.paymentservice.dto.PaymentRequest;
import com.distrishop.paymentservice.dto.PaymentResponse;
import com.distrishop.paymentservice.model.Payment;
import com.distrishop.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Payment processing service.
 *
 * Distributed Systems patterns demonstrated:
 *  1. Idempotency: duplicate payments for same orderId rejected with 409 if already SUCCESS
 *  2. Simulated external gateway: encapsulates real gateway complexity
 *  3. Audit trail: every attempt (success or failure) is persisted
 *  4. Transaction ID generation: globally unique IDs for cross-service tracing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${payment.gateway.simulate-failure-rate:0.05}")
    private double simulateFailureRate;

    private final Random random = new Random();

    /**
     * Process a payment for an order.
     * Idempotency: if a SUCCESS payment already exists for this orderId, returns it directly.
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        // Idempotency check: prevent double-charging the same order
        if (paymentRepository.existsByOrderIdAndStatus(request.getOrderId(), Payment.PaymentStatus.SUCCESS)) {
            log.warn("Duplicate payment attempt for orderId={} - returning existing success", request.getOrderId());
            List<Payment> existing = paymentRepository.findByOrderId(request.getOrderId());
            Payment successPayment = existing.stream()
                    .filter(p -> p.getStatus() == Payment.PaymentStatus.SUCCESS)
                    .findFirst()
                    .orElseThrow();
            return toResponse(successPayment, "Payment already processed (idempotent response)");
        }

        // Create a PENDING payment record first (audit trail)
        String transactionId = "TXN-" + UUID.randomUUID().toString().toUpperCase().replace("-", "").substring(0, 16);
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .transactionId(transactionId)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .paymentMethod(request.getPaymentMethod())
                .status(Payment.PaymentStatus.PROCESSING)
                .build();
        payment = paymentRepository.save(payment);

        // Simulate gateway call
        boolean gatewaySuccess = simulateGatewayCall(request);

        if (gatewaySuccess) {
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setGatewayResponse("{\"gateway\": \"stripe-sim\", \"result\": \"charge_succeeded\"}");
            log.info("Payment SUCCESS: orderId={}, transactionId={}, amount={}",
                    request.getOrderId(), transactionId, request.getAmount());
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Simulated gateway decline: insufficient_funds");
            payment.setGatewayResponse("{\"gateway\": \"stripe-sim\", \"result\": \"charge_declined\", \"decline_code\": \"insufficient_funds\"}");
            log.warn("Payment FAILED: orderId={}, transactionId={}", request.getOrderId(), transactionId);
        }

        payment = paymentRepository.save(payment);
        return toResponse(payment, gatewaySuccess ? "Payment processed successfully" : "Payment declined by gateway");
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId).stream()
                .map(p -> toResponse(p, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByTransactionId(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));
        return toResponse(payment, null);
    }

    /**
     * Simulates calling an external payment gateway.
     * In production, this would call Stripe, PayPal, etc.
     * Returns false ~5% of the time to simulate declines.
     */
    private boolean simulateGatewayCall(PaymentRequest request) {
        // Simulate network delay
        try {
            Thread.sleep(100 + random.nextInt(200));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Reject null or zero amounts
        if (request.getAmount() == null || request.getAmount().doubleValue() <= 0) {
            return false;
        }

        // Simulate configurable failure rate
        return random.nextDouble() >= simulateFailureRate;
    }

    private PaymentResponse toResponse(Payment payment, String message) {
        return PaymentResponse.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus().name())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .message(message != null ? message : payment.getStatus().name())
                .processedAt(payment.getUpdatedAt())
                .build();
    }
}
