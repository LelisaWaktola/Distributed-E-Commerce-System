package com.distrishop.productservice.controller;

import com.distrishop.productservice.dto.*;
import com.distrishop.productservice.service.ProductService;
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
@Tag(name = "Product API", description = "Handles product catalog management, browsing, search, and inter-service stock validation endpoints.")
public class ProductController {

    private final ProductService productService;

    /**
     * GET /api/products?page=0&size=20
     */
    @Operation(
            summary = "Get all products (paginated)",
            description = "Returns a paginated list of products. Used by frontend for catalog browsing."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Products fetched successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching products")
    })
    @GetMapping
    public ResponseEntity<?> getAllProducts(
            @Parameter(description = "Page number (starting from 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Number of products per page", example = "20")
            @RequestParam(defaultValue = "20") int size
    ) {
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
    @Operation(
            summary = "Get product by ID",
            description = "Fetches a product details by its unique ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product fetched successfully",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(
            @Parameter(description = "Product ID to fetch", required = true, example = "1")
            @PathVariable Long id
    ) {
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
    @Operation(
            summary = "Get product by slug",
            description = "Fetches product details using SEO-friendly slug (example: iphone-15-pro). Used by frontend product pages."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product fetched successfully",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getProductBySlug(
            @Parameter(description = "Product slug used in URL", required = true, example = "iphone-15-pro")
            @PathVariable String slug
    ) {
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
    @Operation(
            summary = "Create new product",
            description = "Creates a new product in the catalog. In real production systems this should be restricted to admin/vendor roles."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Product created successfully",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid product request",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestBody(
                    description = "Product creation request body",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ProductRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody ProductRequest request
    ) {
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
    @Operation(
            summary = "Update product by ID",
            description = "Updates an existing product details by product ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product updated successfully",
                    content = @Content(schema = @Schema(implementation = ProductResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @Parameter(description = "Product ID to update", required = true, example = "1")
            @PathVariable Long id,

            @RequestBody(
                    description = "Product update request body",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ProductRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody ProductRequest request
    ) {
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
    @Operation(
            summary = "Delete (deactivate) product",
            description = "Soft deletes a product by setting its status to INACTIVE. The product remains in database but is no longer visible."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product deactivated successfully"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @Parameter(description = "Product ID to deactivate", required = true, example = "1")
            @PathVariable Long id
    ) {
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
    @Operation(
            summary = "Check stock availability (Inter-service API)",
            description = "Used by order-service to verify if a product is available in stock before creating an order. This is an inter-service endpoint."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stock checked successfully",
                    content = @Content(schema = @Schema(implementation = StockCheckResponse.class))),
            @ApiResponse(responseCode = "404", description = "Product not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/stock/check/{id}")
    public ResponseEntity<?> checkStock(
            @Parameter(description = "Product ID to check stock", required = true, example = "1")
            @PathVariable Long id
    ) {
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
    @Operation(
            summary = "Get all categories (alternative route)",
            description = "Returns all categories available in the system. This endpoint duplicates /api/categories and is mainly used for backward compatibility."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categories fetched successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching categories")
    })
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

    @Operation(
            summary = "Health check endpoint",
            description = "Returns the current status of product-service. Useful for monitoring and testing."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Service is UP")
    })
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "product-service",
                "status", "UP",
                "port", "8082"
        ));
    }
}