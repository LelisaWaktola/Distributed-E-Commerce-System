package com.distrishop.productservice.controller;

import com.distrishop.productservice.dto.CategoryResponse;
import com.distrishop.productservice.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
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
 * Separate controller for category endpoints at /api/categories.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Category API", description = "Handles product category endpoints such as listing all available categories.")
public class CategoryController {

    private final ProductService productService;

    @Operation(
            summary = "Get all categories",
            description = "Returns a list of all product categories available in the catalog. Used by frontend for filtering and browsing products."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Categories fetched successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error while fetching categories")
    })
    @GetMapping
    public ResponseEntity<?> getAllCategories() {
        try {
            List<CategoryResponse> categories = productService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error fetching categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch categories"));
        }
    }
}