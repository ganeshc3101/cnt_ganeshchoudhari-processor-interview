package com.processor.core.exception;

/**
 * Base exception for all domain-level processing failures in processor-core.
 * Specific failure types should extend this class.
 */
public class ProcessingException extends RuntimeException {

    private final String code;

    public ProcessingException(String code, String message) {
        super(message);
        this.code = code;
    }

    public ProcessingException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
