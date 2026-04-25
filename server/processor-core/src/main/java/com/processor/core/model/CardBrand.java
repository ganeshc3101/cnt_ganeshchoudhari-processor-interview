package com.processor.core.model;

import java.util.Optional;

/**
 * Supported card brands. Derived from the card number's leading digit.
 *
 * <ul>
 *   <li>3 → AMEX</li>
 *   <li>4 → VISA</li>
 *   <li>5 → MASTERCARD</li>
 *   <li>6 → DISCOVER</li>
 * </ul>
 *
 * Any other leading digit MUST be rejected.
 */
public enum CardBrand {
    AMEX('3'),
    VISA('4'),
    MASTERCARD('5'),
    DISCOVER('6');

    private final char firstDigit;

    CardBrand(char firstDigit) {
        this.firstDigit = firstDigit;
    }

    public char firstDigit() {
        return firstDigit;
    }

    /**
     * Resolves a {@link CardBrand} from the leading digit of a card number,
     * if it maps to a supported brand.
     *
     * @param digit a character between '0' and '9'
     * @return the matching brand, or empty for unsupported digits
     */
    public static Optional<CardBrand> fromFirstDigit(char digit) {
        for (CardBrand brand : values()) {
            if (brand.firstDigit == digit) {
                return Optional.of(brand);
            }
        }
        return Optional.empty();
    }
}
