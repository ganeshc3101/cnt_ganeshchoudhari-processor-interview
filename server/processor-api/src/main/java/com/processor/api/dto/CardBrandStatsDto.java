package com.processor.api.dto;

import java.math.BigDecimal;

public record CardBrandStatsDto(String cardBrand, long count, BigDecimal totalVolume) {
}
