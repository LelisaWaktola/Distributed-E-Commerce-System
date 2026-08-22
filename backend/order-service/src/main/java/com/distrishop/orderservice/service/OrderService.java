package com.distrishop.orderservice.service;

import com.distrishop.orderservice.dto.*;
import com.distrishop.orderservice.model.Cart;
import com.distrishop.orderservice.model.Order;
import com.distrishop.orderservice.model.OrderItem;
import com.distrishop.orderservice.repository.CartRepository;
import com.distrishop.orderservice.repository.OrderItemRepository;
import com.distrishop.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Core order orchestration service.
 *
 * Distributed Systems patterns demonstrated:
 *  1. Synchronous service-to-service calls (order -> product, order -> payment)
 *  2. Fault tolerance: when downstream service is unreachable, throw ServiceUnavailableException
 *  3. Transaction boundary: DB writes only happen after external calls succeed
 *  4. Compensating logic intent (order set to CANCELLED if payment fails)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final RestTemplate restTemplate;

    @Value("${services.product-service.url}")
    private String productServiceUrl;

    @Value("${services.payment-service.url}")
    private String paymentServiceUrl;

    // Custom exception for downstream unavailability
    public static class ServiceUnavailableException extends RuntimeException {
        public ServiceUnavailableException(String message) {
            super(message);
        }
    }

    // ==============================
    // CART OPERATIONS
    // ==============================

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        List<Cart> cartItems = cartRepository.findByUserId(userId);
        return toCartResponse(userId, cartItems);
    }

    @Transactional
    public CartResponse addToCart(CartRequest request) {
        // Verify product exists and is in stock via product-service
        StockCheckResponse stock = callProductServiceStockCheck(request.getProductId());
        if (!stock.isInStock()) {
            throw new IllegalStateException("Product is out of stock: " + request.getProductId());
        }

        Optional<Cart> existing = cartRepository.findByUserIdAndProductId(
                request.getUserId(), request.getProductId());

        Cart cart;
        if (existing.isPresent()) {
            // Update quantity if item already in cart
            cart = existing.get();
            cart.setQuantity(cart.getQuantity() + request.getQuantity());
        } else {
            cart = Cart.builder()
                    .userId(request.getUserId())
                    .productId(request.getProductId())
                    .productName(stock.getProductName())
                    .unitPrice(stock.getPrice())
                    .quantity(request.getQuantity())
                    .build();
        }

        cartRepository.save(cart);
        log.info("Added product {} to cart for user {}", request.getProductId(), request.getUserId());

        List<Cart> allItems = cartRepository.findByUserId(request.getUserId());
        return toCartResponse(request.getUserId(), allItems);
    }

    @Transactional
    public void removeFromCart(Long userId, Long productId) {
        cartRepository.deleteByUserIdAndProductId(userId, productId);
        log.info("Removed product {} from cart for user {}", productId, userId);
    }

    // ==============================
    // ORDER OPERATIONS
    // ==============================

    /**
     * Create an order from the user's cart.
     *
     * Steps (Saga-like orchestration):
     *  1. Load cart items
     *  2. Verify each product is in stock (call product-service)
     *  3. Persist order with PENDING status
     *  4. Call payment-service to process payment
     *  5a. Payment succeeds: update order to CONFIRMED
     *  5b. Payment fails: update order to CANCELLED (compensation)
     */
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        List<Cart> cartItems = cartRepository.findByUserId(request.getUserId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty for user: " + request.getUserId());
        }

        // Step 2: Verify stock for all items
        for (Cart item : cartItems) {
            StockCheckResponse stock = callProductServiceStockCheck(item.getProductId());
            if (!stock.isInStock() || stock.getAvailableStock() < item.getQuantity()) {
                throw new IllegalStateException(
                        "Insufficient stock for product: " + item.getProductName()
                                + " (requested: " + item.getQuantity()
                                + ", available: " + (stock.getAvailableStock() != null ? stock.getAvailableStock() : 0) + ")"
                );
            }
        }



        // Calculate total
        BigDecimal total = cartItems.stream()
                .filter(c -> c.getUnitPrice() != null)
                .map(c -> c.getUnitPrice().multiply(BigDecimal.valueOf(c.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Step 3: Persist order as PENDING
        Order order = Order.builder()
                .userId(request.getUserId())
                .status(Order.OrderStatus.PENDING)
                .totalAmount(total)
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .build();
        order = orderRepository.save(order);

        // Persist order items
        final Order savedOrder = order;
        List<OrderItem> orderItems = cartItems.stream().map(cart -> OrderItem.builder()
                .order(savedOrder)
                .productId(cart.getProductId())
                .productName(cart.getProductName() != null ? cart.getProductName() : "Product #" + cart.getProductId())
                .unitPrice(cart.getUnitPrice() != null ? cart.getUnitPrice() : BigDecimal.ZERO)
                .quantity(cart.getQuantity())
                .lineTotal(cart.getUnitPrice() != null
                        ? cart.getUnitPrice().multiply(BigDecimal.valueOf(cart.getQuantity()))
                        : BigDecimal.ZERO)
                .build()
        ).collect(Collectors.toList());
        orderItemRepository.saveAll(orderItems);

        // Step 4: Call payment-service
        PaymentResponse payment = callPaymentService(PaymentRequest.builder()
                .orderId(order.getId())
                .userId(request.getUserId())
                .amount(total)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CREDIT_CARD")
                .currency("USD")
                .build());

        // Step 5: Update order status based on payment result
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus()) || "COMPLETED".equalsIgnoreCase(payment.getStatus())) {
            order.setStatus(Order.OrderStatus.CONFIRMED);
            order.setPaymentTransactionId(payment.getTransactionId());
            log.info("Order {} confirmed with transaction {}", order.getId(), payment.getTransactionId());
        } else {
            order.setStatus(Order.OrderStatus.CANCELLED);
            log.warn("Order {} cancelled due to payment failure: {}", order.getId(), payment.getMessage());
        }
        order = orderRepository.save(order);

        // Clear cart after successful order
        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            cartRepository.deleteAllByUserId(request.getUserId());
        }

        return toOrderResponse(order, orderItems);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(order -> {
                    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                    return toOrderResponse(order, items);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(order -> {
                    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                    return toOrderResponse(order, items);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found: " + orderId));

        Order.OrderStatus newStatus;

        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid order status: " + status
            );
        }

        order.setStatus(newStatus);

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> items =
                orderItemRepository.findByOrderId(savedOrder.getId());

        return toOrderResponse(savedOrder, items);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        return toOrderResponse(order, items);
    }

    // ==============================
    // INTER-SERVICE CALLS (with fault tolerance)
    // ==============================

    /**
     * Calls product-service to check stock.
     * Throws ServiceUnavailableException if the service is unreachable.
     */
    private StockCheckResponse callProductServiceStockCheck(Long productId) {
        String url = productServiceUrl + "/api/products/stock/check/" + productId;
        log.debug("Calling product-service: GET {}", url);
        try {
            ResponseEntity<StockCheckResponse> response =
                    restTemplate.getForEntity(url, StockCheckResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new ServiceUnavailableException("product-service returned non-2xx for product: " + productId);
        } catch (ResourceAccessException e) {
            // Connection refused / timeout - downstream is down
            log.error("product-service is unreachable: {}", e.getMessage());
            throw new ServiceUnavailableException(
                    "product-service is currently unavailable. Cannot verify stock for product " + productId);
        } catch (ServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling product-service", e);
            throw new ServiceUnavailableException("Failed to reach product-service: " + e.getMessage());
        }
    }

    /**
     * Calls payment-service to process payment.
     * Throws ServiceUnavailableException if the service is unreachable.
     */
    private PaymentResponse callPaymentService(PaymentRequest request) {
        String url = paymentServiceUrl + "/api/payments/process";
        log.debug("Calling payment-service: POST {} for orderId={}", url, request.getOrderId());
        try {
            ResponseEntity<PaymentResponse> response =
                    restTemplate.postForEntity(url, request, PaymentResponse.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            throw new ServiceUnavailableException("payment-service returned non-2xx for order: " + request.getOrderId());
        } catch (HttpClientErrorException e) {
            // 402 Payment Required = gateway declined - treat as soft failure, not an outage
            PaymentResponse declined = null;
            try {
                declined = e.getResponseBodyAs(PaymentResponse.class);
            } catch (Exception ignored) {}
            if (declined != null) {
                log.warn("Payment declined by gateway for orderId={}: {}", request.getOrderId(), declined.getMessage());
                return declined;
            }
            throw new ServiceUnavailableException("payment-service client error for order: " + request.getOrderId());
        } catch (ResourceAccessException e) {
            log.error("payment-service is unreachable: {}", e.getMessage());
            throw new ServiceUnavailableException(
                    "payment-service is currently unavailable. Cannot process payment for order " + request.getOrderId());
        } catch (ServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error calling payment-service", e);
            throw new ServiceUnavailableException("Failed to reach payment-service: " + e.getMessage());
        }
    }



    // ==============================
    // MAPPERS
    // ==============================

    private CartResponse toCartResponse(Long userId, List<Cart> cartItems) {
        List<CartResponse.CartItemResponse> items = cartItems.stream().map(c ->
                CartResponse.CartItemResponse.builder()
                        .id(c.getId())
                        .productId(c.getProductId())
                        .productName(c.getProductName())
                        .unitPrice(c.getUnitPrice())
                        .quantity(c.getQuantity())
                        .lineTotal(c.getUnitPrice() != null
                                ? c.getUnitPrice().multiply(BigDecimal.valueOf(c.getQuantity()))
                                : null)
                        .addedAt(c.getAddedAt())
                        .build()
        ).collect(Collectors.toList());

        BigDecimal total = items.stream()
                .filter(i -> i.getLineTotal() != null)
                .map(CartResponse.CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .userId(userId)
                .items(items)
                .totalAmount(total)
                .itemCount(items.size())
                .build();
    }

    private OrderResponse toOrderResponse(Order order, List<OrderItem> items) {
        List<OrderResponse.OrderItemResponse> itemResponses = items.stream().map(item ->
                OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .lineTotal(item.getLineTotal())
                        .build()
        ).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .paymentTransactionId(order.getPaymentTransactionId())
                .notes(order.getNotes())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
