package com.processor.core.validator;

/**
 * Pure-Java validator for card numbers.
 * No framework dependencies. Business rules to be added in a later phase.
 */
public final class CardValidator {

    /**
     * Validates the structural and Luhn correctness of a card number.
     * Implementation intentionally omitted in the skeleton.
     */
    public boolean isValid(String cardNumber) {
        throw new UnsupportedOperationException("CardValidator#isValid is not implemented yet");
    }

    /**
     * Resolves the card brand from a card number (e.g. VISA, MASTERCARD, AMEX, DISCOVER).
     * Implementation intentionally omitted in the skeleton.
     */
    public String resolveBrand(String cardNumber) {
        throw new UnsupportedOperationException("CardValidator#resolveBrand is not implemented yet");
    }
}
