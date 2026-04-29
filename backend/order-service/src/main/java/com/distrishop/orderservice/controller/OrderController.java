package com.distrishop.orderservice.controller;

import com.distrishop.orderservice.dto.CreateOrderRequest;
import com.distrishop.orderservice.dto.OrderResponse;
import com.distrishop.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Order REST Controller.
 *
 * Demonstrates distributed systems fault tolerance:
 * - When product-service is unreachable: returns HTTP 503 with descriptive message
 * - When payment-service is unreachable: returns HTTP 503 with descriptive message
 * - All other internal errors return HTTP 500
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * Creates an order from the user's cart.
     * Calls product-service (stock check) and payment-service (payment processing).
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            log.info("Creating order for user: {}", request.getUserId());
            OrderResponse order = orderService.createOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (OrderService.ServiceUnavailableException e) {
            // Downstream service is down - return 503
            log.error("Downstream service unavailable during order creation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "Service Unavailable",
                            "message", e.getMessage(),
                            "suggestion", "Please retry in a few moments. Our team has been notified."
                    ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create order"));
        }
    }

    /**
     * GET /api/orders/{userId}
     * Returns all orders for a user.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getOrdersByUserId(@PathVariable Long userId) {
        try {
            List<OrderResponse> orders = orderService.getOrdersByUserId(userId);
            return ResponseEntity.ok(Map.of("orders", orders, "count", orders.size()));
        } catch (Exception e) {
            log.error("Error fetching orders for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch orders"));
        }
    }

    /**
     * GET /api/orders/detail/{orderId}
     * Returns full order details including line items.
     */
    @GetMapping("/detail/{orderId}")
    public ResponseEntity<?> getOrderDetail(@PathVariable Long orderId) {
        try {
            OrderResponse order = orderService.getOrderDetail(orderId);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching order detail {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch order"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "order-service",
                "status", "UP",
                "port", "8083",
                "downstream.product-service", "http://localhost:8082",
                "downstream.payment-service", "http://localhost:8084"
        ));
    }
}
