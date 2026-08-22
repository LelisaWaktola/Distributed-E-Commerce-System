package com.distrishop.orderservice.controller;

import com.distrishop.orderservice.dto.CreateOrderRequest;
import com.distrishop.orderservice.dto.OrderResponse;
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
@Tag(name = "Order API", description = "Handles order creation, order history retrieval, and detailed order lookup. Communicates with product-service and payment-service.")
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/orders
     * Creates an order from the user's cart.
     * Calls product-service (stock check) and payment-service (payment processing).
     */
    @Operation(
            summary = "Create new order",
            description = "Creates a new order from the user's cart. Performs stock validation via product-service and payment processing via payment-service. Returns 503 if downstream services are unavailable."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order created successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid order request (ex: cart empty, payment failed, invalid user)",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "503", description = "Downstream service unavailable (product-service or payment-service)",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error while creating order",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestBody(
                    description = "Request containing userId and required order creation information.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = CreateOrderRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody CreateOrderRequest request
    ) {
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
    @Operation(
            summary = "Get all orders for a user",
            description = "Returns a list of all orders placed by a specific user."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders fetched successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching orders",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/{userId}")
    public ResponseEntity<?> getOrdersByUserId(
            @Parameter(description = "User ID to fetch orders for", required = true, example = "1")
            @PathVariable Long userId
    ) {
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
    @Operation(
            summary = "Get order detail by order ID",
            description = "Returns full order information including line items, product details, and order status."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order details fetched successfully",
                    content = @Content(schema = @Schema(implementation = OrderResponse.class))),
            @ApiResponse(responseCode = "404", description = "Order not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching order details",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/detail/{orderId}")
    public ResponseEntity<?> getOrderDetail(
            @Parameter(description = "Order ID to fetch full details", required = true, example = "100")
            @PathVariable Long orderId
    ) {
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

    /**
     * GET /api/orders
     * Returns all orders for admin management.
     */
    @Operation(
            summary = "Get all orders",
            description = "Returns all orders from all users. Intended for admin order management."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All orders fetched successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching orders",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        try {
            List<OrderResponse> orders = orderService.getAllOrders();

            return ResponseEntity.ok(
                    Map.of(
                            "orders", orders,
                            "count", orders.size()
                    )
            );

        } catch (Exception e) {
            log.error("Error fetching all orders", e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch all orders"));
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status
    ) {
        try {
            OrderResponse order =
                    orderService.updateOrderStatus(orderId, status);

            return ResponseEntity.ok(order);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));

        } catch (Exception e) {
            log.error("Error updating status for order {}", orderId, e);

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update order status"));
        }
    }

    @Operation(
            summary = "Health check endpoint",
            description = "Returns health status of order-service and downstream dependencies such as product-service and payment-service."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Service is UP")
    })
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