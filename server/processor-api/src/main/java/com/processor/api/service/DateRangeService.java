package com.processor.api.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Resolves [from, to) window for report and list filters.
 */
@Component
public class DateRangeService {

    private static final int DEFAULT_DAYS = 30;

    private final Clock clock;

    public DateRangeService(Clock clock) {
        this.clock = clock;
    }

    public Instant fromOrDefault(Instant from) {
        return fromOrDefault(from, DEFAULT_DAYS);
    }

    /**
     * When {@code from} is null, uses now minus {@code daysBackWhenNull} (minimum 1 day).
     */
    public Instant fromOrDefault(Instant from, int daysBackWhenNull) {
        if (from != null) {
            return from;
        }
        int days = daysBackWhenNull < 1 ? DEFAULT_DAYS : daysBackWhenNull;
        return clock.instant().minus(days, ChronoUnit.DAYS);
    }

    public Instant toOrDefault(Instant to) {
        if (to != null) {
            return to;
        }
        return clock.instant();
    }
}
