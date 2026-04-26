package com.processor.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyVolumePointDto(LocalDate day, long transactionCount, BigDecimal totalVolume) {
}
