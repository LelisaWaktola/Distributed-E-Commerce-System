package com.distrishop.orderservice.controller;

import com.distrishop.orderservice.dto.CartRequest;
import com.distrishop.orderservice.dto.CartResponse;
import com.distrishop.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Cart REST Controller.
 *
 * Adding to cart calls product-service to verify stock.
 * If product-service is unreachable, returns 503.
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Slf4j
public class CartController {

    private final OrderService orderService;

    /**
     * GET /api/cart/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId) {
        try {
            CartResponse cart = orderService.getCart(userId);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            log.error("Error fetching cart for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch cart"));
        }
    }

    /**
     * POST /api/cart
     * Add or update a cart item. Verifies stock with product-service.
     */
    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody CartRequest request) {
        try {
            CartResponse cart = orderService.addToCart(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(cart);
        } catch (OrderService.ServiceUnavailableException e) {
            log.error("product-service unavailable during cart add: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "Service Unavailable",
                            "message", e.getMessage(),
                            "suggestion", "Cannot verify product availability right now. Please try again shortly."
                    ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error adding to cart", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add to cart"));
        }
    }

    /**
     * DELETE /api/cart/{userId}/{productId}
     */
    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long userId,
                                            @PathVariable Long productId) {
        try {
            orderService.removeFromCart(userId, productId);
            return ResponseEntity.ok(Map.of(
                    "message", "Item removed from cart",
                    "userId", userId,
                    "productId", productId
            ));
        } catch (Exception e) {
            log.error("Error removing from cart", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove from cart"));
        }
    }
}
