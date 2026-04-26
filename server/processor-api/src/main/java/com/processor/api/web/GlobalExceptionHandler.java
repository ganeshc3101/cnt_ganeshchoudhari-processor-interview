package com.processor.api.web;

import com.processor.api.dto.ApiErrorDto;
import com.processor.api.security.ProcessorJwtException;
import com.processor.core.exception.ProcessingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProcessingException.class)
    public ResponseEntity<ApiErrorDto> processing(ProcessingException e, HttpServletRequest req) {
        if ("NOT_FOUND".equals(e.code())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiErrorDto(e.code(), e.getMessage(), traceId(req), null));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto(e.code(), e.getMessage(), traceId(req), null));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiErrorDto> disabled(DisabledException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorDto("ACCOUNT_DISABLED", e.getMessage(), traceId(req), null));
    }

    @ExceptionHandler(ProcessorJwtException.class)
    public ResponseEntity<ApiErrorDto> jwt(ProcessorJwtException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorDto("AUTH_INVALID", e.getMessage(), traceId(req), null));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorDto> auth(AuthenticationException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiErrorDto("AUTH_FAILED", e.getMessage(), traceId(req), null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorDto> denied(AccessDeniedException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiErrorDto("FORBIDDEN", "Access denied", traceId(req), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDto> validation(MethodArgumentNotValidException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("VALIDATION_ERROR", "Request validation failed", traceId(req),
                        e.getBindingResult().getFieldErrors()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorDto> constraint(ConstraintViolationException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("VALIDATION_ERROR", e.getMessage(), traceId(req), null));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorDto> notReadable(HttpMessageNotReadableException e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorDto("BAD_REQUEST", "Malformed request body", traceId(req), null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDto> generic(Exception e, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorDto("INTERNAL_ERROR", "Unexpected error", traceId(req), null));
    }

    private static String traceId(HttpServletRequest req) {
        String h = req.getHeader("X-Request-Id");
        return h != null && !h.isBlank() ? h : null;
    }
}
