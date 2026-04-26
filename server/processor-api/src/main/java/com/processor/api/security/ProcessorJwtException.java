package com.processor.api.security;

public final class ProcessorJwtException extends RuntimeException {
    public ProcessorJwtException(String message) {
        super(message);
    }

    public ProcessorJwtException(String message, Throwable cause) {
        super(message, cause);
    }
}
