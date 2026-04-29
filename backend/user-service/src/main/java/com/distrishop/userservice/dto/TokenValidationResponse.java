package com.distrishop.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned when other microservices call /api/users/validate/{token}
 * to verify a user's authentication token before serving protected resources.
 * This is the inter-service authentication pattern.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenValidationResponse {
    private boolean valid;
    private Long userId;
    private String email;
    private String role;
    private String message;
}
