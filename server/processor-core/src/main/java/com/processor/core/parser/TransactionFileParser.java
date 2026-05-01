package com.processor.core.parser;

import com.processor.core.exception.ProcessingException;
import com.processor.core.model.ParsedFileRow;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Pure-Java CSV line parser. Expected columns (header row is skipped if detected):
 * {@code cardNumber,amount,currency,occurredAt,cardholderName} — only {@code cardNumber} and
 * {@code amount} are required. JSON/XML are handled in the API module.
 */
public final class TransactionFileParser {

    public List<ParsedFileRow> parse(String format, InputStream input) {
        if (input == null) {
            throw new ProcessingException("PARSE_ERROR", "Empty file");
        }
        String f = format == null ? "csv" : format.trim().toLowerCase(Locale.ROOT);
        if (!"csv".equals(f)) {
            throw new ProcessingException("PARSE_ERROR", "Format not supported in core parser: " + format + " (use csv)");
        }
        return parseCsv(input);
    }

    private List<ParsedFileRow> parseCsv(InputStream input) {
        List<ParsedFileRow> rows = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;
            int lineNo = 0;
            boolean first = true;
            while ((line = br.readLine()) != null) {
                lineNo++;
                if (line.isBlank()) {
                    continue;
                }
                if (first) {
                    first = false;
                    if (looksLikeHeader(line)) {
                        continue;
                    }
                }
                rows.add(parseDataLine(line, lineNo));
            }
        } catch (IOException e) {
            throw new ProcessingException("PARSE_ERROR", "Failed to read CSV", e);
        }
        return rows;
    }

    private static boolean looksLikeHeader(String line) {
        String lower = line.toLowerCase(Locale.ROOT);
        return lower.contains("card") && (lower.contains("amount") || lower.contains("number"));
    }

    private ParsedFileRow parseDataLine(String line, int rowNumber) {
        String[] p = line.split(",", -1);
        if (p.length < 2) {
            throw new ProcessingException("PARSE_ERROR", "Line " + rowNumber + ": need cardNumber,amount at minimum");
        }
        String card = p[0].trim();
        String amountStr = p[1].trim();
        String currency = p.length > 2 && !p[2].isBlank() ? p[2].trim().toUpperCase(Locale.ROOT) : "USD";
        String occurredStr = p.length > 3 && !p[3].isBlank() ? p[3].trim() : null;
        String cardholder = p.length > 4 && !p[4].isBlank() ? p[4].trim() : null;

        BigDecimal amount;
        try {
            amount = new BigDecimal(amountStr);
        } catch (NumberFormatException e) {
            throw new ProcessingException("PARSE_ERROR", "Line " + rowNumber + ": bad amount: " + amountStr);
        }
        Instant occurred;
        try {
            occurred = OccurredAtParsing.parseBatchTimestampLenient(occurredStr);
        } catch (DateTimeParseException e) {
            throw new ProcessingException(
                    "PARSE_ERROR", "Line " + rowNumber + ": bad occurredAt: " + occurredStr, e);
        }
        return new ParsedFileRow(rowNumber, card, cardholder, amount, currency, occurred);
    }
}
