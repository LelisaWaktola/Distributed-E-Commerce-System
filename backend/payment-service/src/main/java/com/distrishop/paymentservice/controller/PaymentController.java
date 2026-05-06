package com.distrishop.paymentservice.controller;

import com.distrishop.paymentservice.dto.PaymentRequest;
import com.distrishop.paymentservice.dto.PaymentResponse;
import com.distrishop.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Payment REST Controller.
 *
 * Called by:
 *  - order-service (POST /api/payments/process) to process payment during checkout
 *
 * Distributed Systems patterns:
 *  - Returns 409 CONFLICT for duplicate payment (idempotency enforcement)
 *  - Persists all transactions for audit trail regardless of outcome
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * POST /api/payments/process
     * Called by order-service to process payment for a completed order.
     * Idempotent: same orderId with existing SUCCESS returns 200 with the original transaction.
     */
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody PaymentRequest request) {
        try {
            log.info("Processing payment: orderId={}, amount={}", request.getOrderId(), request.getAmount());
            PaymentResponse response = paymentService.processPayment(request);

            if ("SUCCESS".equals(response.getStatus())) {
                return ResponseEntity.ok(response);
            } else if ("FAILED".equals(response.getStatus())) {
                // Return 402 Payment Required on gateway decline so order-service can handle it
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error processing payment for orderId={}", request.getOrderId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Payment processing failed due to internal error"));
        }
    }

    /**
     * GET /api/payments/{orderId}
     * Returns all payment attempts for an order (includes failed attempts for audit).
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getPaymentsByOrderId(@PathVariable Long orderId) {
        try {
            List<PaymentResponse> payments = paymentService.getPaymentsByOrderId(orderId);
            return ResponseEntity.ok(Map.of("payments", payments, "count", payments.size()));
        } catch (Exception e) {
            log.error("Error fetching payments for orderId={}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch payments"));
        }
    }

    /**
     * GET /api/payments/status/{transactionId}
     * Look up a specific transaction by its unique ID.
     * Used for payment status polling and cross-service tracing.
     */
    @GetMapping("/status/{transactionId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String transactionId) {
        try {
            PaymentResponse payment = paymentService.getPaymentByTransactionId(transactionId);
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching payment by transactionId={}", transactionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch payment status"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "payment-service",
                "status", "UP",
                "port", "8084"
        ));
    }
}
