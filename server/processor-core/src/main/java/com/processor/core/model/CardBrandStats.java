package com.processor.core.model;

import java.math.BigDecimal;

public record CardBrandStats(CardBrand brand, long count, BigDecimal totalVolume) {
}
