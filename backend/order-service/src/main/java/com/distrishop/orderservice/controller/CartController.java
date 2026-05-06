package com.distrishop.orderservice.controller;

import com.distrishop.orderservice.dto.CartRequest;
import com.distrishop.orderservice.dto.CartResponse;
import com.distrishop.orderservice.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

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
@Tag(name = "Cart API", description = "Handles cart operations such as viewing cart, adding/updating cart items, and removing items. Uses product-service for stock verification.")
public class CartController {

    private final OrderService orderService;

    /**
     * GET /api/cart/{userId}
     */
    @Operation(
            summary = "Get user cart",
            description = "Fetches the current cart of a user by userId. Returns cart items and total cart information."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cart fetched successfully",
                    content = @Content(schema = @Schema(implementation = CartResponse.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching cart",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/{userId}")
    public ResponseEntity<?> getCart(
            @Parameter(description = "User ID to fetch cart for", required = true, example = "1")
            @PathVariable Long userId
    ) {
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
    @Operation(
            summary = "Add item to cart (or update quantity)",
            description = "Adds a product to the user's cart or updates its quantity. Calls product-service to verify stock availability. Returns 503 if product-service is unreachable."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Item added/updated in cart successfully",
                    content = @Content(schema = @Schema(implementation = CartResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request (ex: insufficient stock or invalid quantity)",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "503", description = "product-service unavailable, cannot verify stock",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error while adding to cart",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping
    public ResponseEntity<?> addToCart(
            @RequestBody(
                    description = "Cart request containing userId, productId, and quantity.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CartRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody CartRequest request
    ) {
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
    @Operation(
            summary = "Remove item from cart",
            description = "Removes a specific product from the user's cart by userId and productId."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item removed successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while removing item",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<?> removeFromCart(
            @Parameter(description = "User ID who owns the cart", required = true, example = "1")
            @PathVariable Long userId,

            @Parameter(description = "Product ID to remove from cart", required = true, example = "10")
            @PathVariable Long productId
    ) {
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