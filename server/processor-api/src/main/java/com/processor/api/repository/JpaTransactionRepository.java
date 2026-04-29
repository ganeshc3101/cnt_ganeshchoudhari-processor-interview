package com.processor.api.repository;

import com.processor.api.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface JpaTransactionRepository extends JpaRepository<TransactionEntity, UUID>, JpaSpecificationExecutor<TransactionEntity> {

    @Query("select count(t) from TransactionEntity t where t.occurredAt >= :f and t.occurredAt < :t")
    long countAcceptedBetween(@Param("f") Instant f, @Param("t") Instant t);

    @Query("select coalesce(sum(t.amount), 0) from TransactionEntity t where t.occurredAt >= :f and t.occurredAt < :t")
    BigDecimal sumAmountAccepted(@Param("f") Instant f, @Param("t") Instant t);

    @Query("select coalesce(avg(t.amount), 0) from TransactionEntity t where t.occurredAt >= :f and t.occurredAt < :t")
    BigDecimal avgAmountAccepted(@Param("f") Instant f, @Param("t") Instant t);

    @Query("select t.cardBrand, count(t), coalesce(sum(t.amount),0) from TransactionEntity t where t.occurredAt >= :f and t.occurredAt < :t group by t.cardBrand")
    List<Object[]> groupByCardBrand(@Param("f") Instant f, @Param("t") Instant t);

    @Query(value = """
            select cast(date_trunc('day', t.occurred_at at time zone 'UTC') as date) as d,
                   cast(count(*) as bigint),
                   coalesce(sum(t.amount), 0) as v
            from transactions t
            where t.occurred_at >= :f and t.occurred_at < :t
            group by 1
            order by 1
            """, nativeQuery = true)
    List<Object[]> dailyVolumeNative(@Param("f") Timestamp f, @Param("t") Timestamp t);
}
