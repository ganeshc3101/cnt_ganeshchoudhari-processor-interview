package com.processor.core.parser;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Parses occurrence timestamps from batch files / JSON where values may be full
 * {@link Instant} strings (with {@code Z} or offset) or &quot;local&quot; ISO-8601
 * date-times without zone (interpreted as UTC), e.g. {@code 2025-03-06T05:11:08.759901}.
 */
public final class OccurredAtParsing {

    private OccurredAtParsing() {
    }

    /**
     * @param raw null/blank → {@link Instant#now()}; otherwise parsed leniently
     */
    public static Instant parseBatchTimestampLenient(String raw) {
        if (raw == null || raw.isBlank()) {
            return Instant.now();
        }
        String s = raw.trim();
        try {
            return Instant.parse(s);
        } catch (DateTimeParseException ignored) {
            // e.g. missing 'Z' / offset
        }
        try {
            return OffsetDateTime.parse(s).toInstant();
        } catch (DateTimeParseException ignored) {
            // no zone in string
        }
        return LocalDateTime.parse(s, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                .atOffset(ZoneOffset.UTC)
                .toInstant();
    }
}
