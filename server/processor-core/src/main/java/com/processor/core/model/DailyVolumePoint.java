package com.processor.core.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyVolumePoint(LocalDate day, long transactionCount, BigDecimal totalVolume) {
}
