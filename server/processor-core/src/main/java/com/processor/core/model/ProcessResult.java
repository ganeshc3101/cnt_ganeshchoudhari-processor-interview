package com.processor.core.model;

import java.util.Optional;

/**
 * Result of attempting to accept one transaction. Exactly one of {@code accepted}
 * or {@code rejected} is present.
 */
public record ProcessResult(Optional<Transaction> accepted, Optional<RejectedTransaction> rejected) {

    public static ProcessResult success(Transaction t) {
        return new ProcessResult(Optional.of(t), Optional.empty());
    }

    public static ProcessResult failed(RejectedTransaction r) {
        return new ProcessResult(Optional.empty(), Optional.of(r));
    }
}
