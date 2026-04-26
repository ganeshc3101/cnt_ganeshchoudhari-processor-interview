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
        if (from != null) {
            return from;
        }
        return clock.instant().minus(DEFAULT_DAYS, ChronoUnit.DAYS);
    }

    public Instant toOrDefault(Instant to) {
        if (to != null) {
            return to;
        }
        return clock.instant();
    }
}
