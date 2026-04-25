package com.processor.api.controller;

import com.processor.api.dto.AuthRequestDto;
import com.processor.api.dto.AuthResponseDto;
import com.processor.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints.
 * Placeholder only — real credential handling will land with the security feature.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthRequestDto request) {
        throw new UnsupportedOperationException("AuthController#login is not implemented yet");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        throw new UnsupportedOperationException("AuthController#logout is not implemented yet");
    }
}
