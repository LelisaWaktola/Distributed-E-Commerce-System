package com.distrishop.productservice.controller;

import com.distrishop.productservice.dto.*;
import com.distrishop.productservice.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Product REST Controller.
 *
 * Consumed by:
 *  - Frontend (browse catalog, search by slug)
 *  - order-service (GET /api/products/stock/check/{id}) - inter-service call
 *
 * Demonstrates: catalog microservice pattern, slug routing, inter-service stock API.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    /**
     * GET /api/products?page=0&size=20
     */
    @GetMapping
    public ResponseEntity<?> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<ProductResponse> products = productService.getAllProducts(page, size);
            return ResponseEntity.ok(Map.of(
                    "products", products,
                    "page", page,
                    "size", size,
                    "count", products.size()
            ));
        } catch (Exception e) {
            log.error("Error fetching products", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch products"));
        }
    }

    /**
     * GET /api/products/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            ProductResponse product = productService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching product {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch product"));
        }
    }

    /**
     * GET /api/products/slug/{slug}
     * SEO-friendly product lookup by URL slug.
     */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getProductBySlug(@PathVariable String slug) {
        try {
            ProductResponse product = productService.getProductBySlug(slug);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching product by slug {}", slug, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch product"));
        }
    }

    /**
     * POST /api/products
     * Create a new product (admin/vendor only in production).
     */
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request) {
        try {
            ProductResponse product = productService.createProduct(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating product", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create product"));
        }
    }

    /**
     * PUT /api/products/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id,
                                           @RequestBody ProductRequest request) {
        try {
            ProductResponse product = productService.updateProduct(id, request);
            return ResponseEntity.ok(product);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating product {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update product"));
        }
    }

    /**
     * DELETE /api/products/{id}
     * Soft-delete: sets status to INACTIVE.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deactivated", "id", id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting product {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete product"));
        }
    }

    /**
     * GET /api/products/stock/check/{id}
     * Called by order-service before creating an order.
     * Inter-service API contract endpoint.
     */
    @GetMapping("/stock/check/{id}")
    public ResponseEntity<?> checkStock(@PathVariable Long id) {
        try {
            StockCheckResponse response = productService.checkStock(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error checking stock for product {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check stock"));
        }
    }

    /**
     * GET /api/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            List<CategoryResponse> categories = productService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch categories"));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "product-service",
                "status", "UP",
                "port", "8082"
        ));
    }
}
