package com.distrishop.userservice.service;

import com.distrishop.userservice.dto.*;
import com.distrishop.userservice.model.User;
import com.distrishop.userservice.model.UserSession;
import com.distrishop.userservice.repository.UserRepository;
import com.distrishop.userservice.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;

    private static final long SESSION_DURATION_HOURS = 24L;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(hashPassword(request.getPassword()))
                .phone(request.getPhone())
                .role(User.UserRole.CUSTOMER)
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user: {} (id={})", saved.getEmail(), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new IllegalStateException("Account is deactivated");
        }

        if (!hashPassword(request.getPassword()).equals(user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Deactivate previous sessions (single active session per user for simplicity)
        sessionRepository.deactivateAllByUserId(user.getId());

        // Create new session token
        String token = generateToken(user.getId(), user.getEmail());
        UserSession session = UserSession.builder()
                .user(user)
                .sessionToken(token)
                .expiresAt(LocalDateTime.now().plusHours(SESSION_DURATION_HOURS))
                .build();
        sessionRepository.save(session);

        log.info("User logged in: {} (id={})", user.getEmail(), user.getId());

        return LoginResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .token(token)
                .role(user.getRole().name())
                .expiresIn(SESSION_DURATION_HOURS * 3600)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        User updated = userRepository.save(user);
        log.info("Updated user: {}", id);
        return toResponse(updated);
    }

    @Transactional(readOnly = true)
    public TokenValidationResponse validateToken(String token) {
        Optional<UserSession> sessionOpt = sessionRepository.findBySessionTokenAndIsActiveTrue(token);

        if (sessionOpt.isEmpty()) {
            return TokenValidationResponse.builder()
                    .valid(false)
                    .message("Token not found or already revoked")
                    .build();
        }

        UserSession session = sessionOpt.get();
        if (session.isExpired()) {
            return TokenValidationResponse.builder()
                    .valid(false)
                    .message("Token has expired")
                    .build();
        }

        User user = session.getUser();
        return TokenValidationResponse.builder()
                .valid(true)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .message("Token is valid")
                .build();
    }

    // --- Helpers ---

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateToken(Long userId, String email) {
        String raw = userId + ":" + email + ":" + UUID.randomUUID();
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
