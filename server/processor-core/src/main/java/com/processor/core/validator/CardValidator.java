package com.processor.core.validator;

import com.processor.core.model.CardBrand;

import java.util.Optional;

/**
 * Pure-Java validator for card numbers. Luhn check + first-digit brand routing.
 */
public final class CardValidator {

    /**
     * Normalises to digits only.
     */
    public String normalizeToDigits(String cardNumber) {
        if (cardNumber == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cardNumber.length(); i++) {
            char c = cardNumber.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    public boolean isValid(String cardNumberDigits) {
        if (cardNumberDigits == null || cardNumberDigits.length() < 12 || cardNumberDigits.length() > 19) {
            return false;
        }
        char first = cardNumberDigits.charAt(0);
        if (first < '3' || first > '6') {
            return false;
        }
        if (CardBrand.fromFirstDigit(first).isEmpty()) {
            return false;
        }
        return passesLuhn(cardNumberDigits);
    }

    /**
     * Resolves the card brand from the first digit, or returns {@code null} if unsupported.
     */
    public String resolveBrandCode(String cardNumberDigits) {
        if (cardNumberDigits == null || cardNumberDigits.isEmpty()) {
            return null;
        }
        return CardBrand.fromFirstDigit(cardNumberDigits.charAt(0))
                .map(Enum::name)
                .orElse(null);
    }

    public Optional<CardBrand> resolveBrand(String cardNumberDigits) {
        if (cardNumberDigits == null || cardNumberDigits.isEmpty()) {
            return Optional.empty();
        }
        return CardBrand.fromFirstDigit(cardNumberDigits.charAt(0));
    }

    public String first4(String digits) {
        if (digits == null || digits.length() < 4) {
            return "";
        }
        return digits.substring(0, 4);
    }

    public String last4(String digits) {
        if (digits == null || digits.length() < 4) {
            return "";
        }
        return digits.substring(digits.length() - 4);
    }

    private static boolean passesLuhn(String digits) {
        int sum = 0;
        boolean alternate = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = digits.charAt(i) - '0';
            if (n < 0 || n > 9) {
                return false;
            }
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }
}
