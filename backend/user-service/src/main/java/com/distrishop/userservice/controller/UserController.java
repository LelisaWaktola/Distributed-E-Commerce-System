package com.distrishop.userservice.controller;

import com.distrishop.userservice.dto.*;
import com.distrishop.userservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * User REST Controller.
 *
 * Provides endpoints consumed by:
 *  - Frontend React app (register/login)
 *  - Other microservices (validate token for auth)
 *
 * Demonstrates: stateless REST, token-based auth pattern, inter-service token validation.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Service API", description = "Handles user registration, authentication, profile management, and token validation for other microservices.")
public class UserController {

    private final UserService userService;

    /**
     * POST /api/users/register
     * Creates a new user account.
     */
    @Operation(
            summary = "Register a new user",
            description = "Creates a new user account using email, password, and other registration fields. Returns the created user profile if successful."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "409", description = "User already exists or registration conflict",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody(
                    description = "User registration request containing email, password, and required fields.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = RegisterRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody RegisterRequest request
    ) {
        try {
            log.info("Registration attempt for email: {}", request.getEmail());
            UserResponse response = userService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed due to internal error"));
        }
    }

    /**
     * POST /api/users/login
     * Authenticates user and returns a session token.
     */
    @Operation(
            summary = "Login user",
            description = "Authenticates a user using email and password. Returns login token/session details if credentials are correct."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid email or password",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "403", description = "Login blocked (account disabled or restricted)",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody(
                    description = "User login request containing email and password.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = LoginRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody LoginRequest request
    ) {
        try {
            log.info("Login attempt for email: {}", request.getEmail());
            LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Login failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Login blocked: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed due to internal error"));
        }
    }

    /**
     * GET /api/users/{id}
     * Fetches user profile by ID.
     */
    @Operation(
            summary = "Get user profile by ID",
            description = "Fetches a user profile using the unique user ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User found successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @Parameter(description = "User ID to fetch the profile", example = "1", required = true)
            @PathVariable Long id
    ) {
        try {
            UserResponse response = userService.getUserById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching user {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch user"));
        }
    }

    /**
     * PUT /api/users/{id}
     * Updates user profile fields.
     */
    @Operation(
            summary = "Update user profile",
            description = "Updates user profile fields such as name, phone, or other editable attributes."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @Parameter(description = "User ID to update", example = "1", required = true)
            @PathVariable Long id,

            @RequestBody(
                    description = "Update request containing fields to modify user profile.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = UpdateUserRequest.class))
            )
            @org.springframework.web.bind.annotation.RequestBody UpdateUserRequest request
    ) {
        try {
            UserResponse response = userService.updateUser(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating user {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update user"));
        }
    }

    /**
     * GET /api/users/validate/{token}
     * Called by other microservices to validate authentication tokens.
     * This is the inter-service authentication check endpoint.
     */
    @Operation(
            summary = "Validate authentication token",
            description = "Used by other microservices to validate if a token is valid. Returns token validation status and user details if valid."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token is valid",
                    content = @Content(schema = @Schema(implementation = TokenValidationResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token is invalid or expired",
                    content = @Content(schema = @Schema(implementation = TokenValidationResponse.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/validate/{token}")
    public ResponseEntity<?> validateToken(
            @Parameter(description = "Token to validate", required = true, example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
            @PathVariable String token
    ) {
        try {
            TokenValidationResponse response = userService.validateToken(token);
            if (response.isValid()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            log.error("Error validating token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Token validation failed"));
        }
    }

    /**
     * GET /api/users/health
     * Simple health check beyond actuator.
     */
    @Operation(
            summary = "Health check endpoint",
            description = "Returns basic service health status and metadata. Useful for testing and monitoring."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Service is UP",
                    content = @Content(schema = @Schema(implementation = Map.class)))
    })
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "user-service",
                "status", "UP",
                "port", "8081"
        ));
    }
}