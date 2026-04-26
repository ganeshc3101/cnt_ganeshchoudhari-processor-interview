package com.processor.api.dto;

import java.util.List;

/**
 * Request parameters for GET /api/v1/transactions (query string).
 * Parsed manually in the controller; kept as a record for clarity in tests.
 */
public record TransactionListRequestParams(
        String from,
        String to,
        List<String> cardBrands,
        String minAmount,
        String maxAmount,
        int page,
        int size
) {
}
