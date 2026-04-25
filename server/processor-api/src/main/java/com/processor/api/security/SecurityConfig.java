package com.processor.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Placeholder for Spring Security configuration.
 * Real implementation will declare a SecurityFilterChain that registers JwtFilter,
 * enforces stateless sessions, and applies deny-by-default authorization rules.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public JwtFilter jwtFilter(JwtUtil jwtUtil) {
        return new JwtFilter(jwtUtil);
    }
}
