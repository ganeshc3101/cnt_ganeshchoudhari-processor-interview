package com.processor.api.service;

import com.processor.api.dto.AuthRequestDto;
import com.processor.api.dto.AuthResponseDto;
import com.processor.api.security.JwtUtil;
import org.springframework.stereotype.Service;

/**
 * Application service for authentication flows.
 * Will delegate credential verification and token issuance in a later phase.
 */
@Service
public class AuthService {

    private final JwtUtil jwtUtil;

    public AuthService(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public AuthResponseDto login(AuthRequestDto request) {
        throw new UnsupportedOperationException("AuthService#login is not implemented yet");
    }

    public void logout() {
        throw new UnsupportedOperationException("AuthService#logout is not implemented yet");
    }
}
