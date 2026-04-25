package com.processor.core.parser;

import com.processor.core.model.Transaction;

import java.io.InputStream;
import java.util.List;

/**
 * Pure-Java parser for transaction files (CSV, JSON, XML).
 * Implementations will be added per format in a later phase.
 */
public final class TransactionFileParser {

    /**
     * Parse an input stream of the declared format into domain transactions.
     * @param format one of "csv", "json", "xml"
     */
    public List<Transaction> parse(String format, InputStream input) {
        throw new UnsupportedOperationException("TransactionFileParser#parse is not implemented yet");
    }
}
