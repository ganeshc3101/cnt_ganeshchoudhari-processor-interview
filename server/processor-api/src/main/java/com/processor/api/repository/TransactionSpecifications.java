package com.processor.api.repository;

import com.processor.api.entity.TransactionEntity;
import com.processor.core.model.CardBrand;
import com.processor.core.model.TransactionListQuery;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA {@link Specification} helpers for the transaction list query.
 */
public final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    public static Specification<TransactionEntity> fromQuery(TransactionListQuery q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), q.fromOccurredAt()));
            p.add(cb.lessThan(root.get("occurredAt"), q.toOccurredAt()));
            if (q.cardBrands() != null && !q.cardBrands().isEmpty()) {
                List<String> brands = q.cardBrands().stream().map(CardBrand::name).toList();
                p.add(root.get("cardBrand").in(brands));
            }
            if (q.minAmount() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("amount"), q.minAmount()));
            }
            if (q.maxAmount() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("amount"), q.maxAmount()));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
