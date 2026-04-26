package com.processor.api.repository;

import com.processor.api.entity.TransactionEntity;
import com.processor.api.mapper.TransactionMapper;
import com.processor.core.model.CardBrand;
import com.processor.core.model.CardBrandStats;
import com.processor.core.model.DailyVolumePoint;
import com.processor.core.model.DashboardMetrics;
import com.processor.core.model.PageResult;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import com.processor.core.model.TransactionListQuery;
import com.processor.core.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class TransactionRepositoryImpl implements TransactionRepository {

    private final JpaTransactionRepository jpaTransactionRepository;
    private final JpaRejectedTransactionRepository jpaRejectedTransactionRepository;
    private final TransactionMapper transactionMapper;

    public TransactionRepositoryImpl(
            JpaTransactionRepository jpaTransactionRepository,
            JpaRejectedTransactionRepository jpaRejectedTransactionRepository,
            TransactionMapper transactionMapper) {
        this.jpaTransactionRepository = jpaTransactionRepository;
        this.jpaRejectedTransactionRepository = jpaRejectedTransactionRepository;
        this.transactionMapper = transactionMapper;
    }

    @Override
    public Transaction save(Transaction transaction) {
        TransactionEntity e = transactionMapper.toNewEntity(transaction);
        return transactionMapper.toDomain(jpaTransactionRepository.save(e));
    }

    @Override
    public Optional<Transaction> findById(UUID id) {
        return jpaTransactionRepository.findById(id).map(transactionMapper::toDomain);
    }

    @Override
    public PageResult<Transaction> findTransactions(TransactionListQuery query) {
        int page = query.safePage();
        int size = query.safeSize();
        Page<TransactionEntity> p = jpaTransactionRepository.findAll(
                TransactionSpecifications.fromQuery(query),
                PageRequest.of(
                        page,
                        size,
                        Sort.by(Sort.Order.desc("occurredAt"), Sort.Order.desc("id"))));
        List<Transaction> list = p.getContent().stream().map(transactionMapper::toDomain).toList();
        return PageResult.of(list, p.getNumber(), p.getSize(), p.getTotalElements());
    }

    @Override
    public RejectedTransaction saveRejected(RejectedTransaction rejected) {
        return transactionMapper.toDomain(
                jpaRejectedTransactionRepository.save(transactionMapper.toNewEntity(rejected)));
    }

    @Override
    public DashboardMetrics metrics(Instant from, Instant to) {
        long acc = jpaTransactionRepository.countAcceptedBetween(from, to);
        long rej = jpaRejectedTransactionRepository.countCreatedBetween(from, to);
        BigDecimal totalVol = jpaTransactionRepository.sumAmountAccepted(from, to);
        if (totalVol == null) {
            totalVol = BigDecimal.ZERO;
        }
        BigDecimal avg;
        if (acc == 0) {
            avg = BigDecimal.ZERO;
        } else {
            BigDecimal a = jpaTransactionRepository.avgAmountAccepted(from, to);
            avg = a != null ? a : BigDecimal.ZERO;
        }
        return new DashboardMetrics(acc + rej, acc, rej, totalVol, avg);
    }

    @Override
    public List<DailyVolumePoint> dailyAcceptedVolume(Instant from, Instant to) {
        Timestamp f = Timestamp.from(from);
        Timestamp t = Timestamp.from(to);
        return jpaTransactionRepository.dailyVolumeNative(f, t).stream()
                .map(row -> {
                    Date d = (Date) row[0];
                    long cnt = ((Number) row[1]).longValue();
                    BigDecimal v = (BigDecimal) row[2];
                    LocalDate day = d.toLocalDate();
                    return new DailyVolumePoint(day, cnt, v != null ? v : BigDecimal.ZERO);
                })
                .toList();
    }

    @Override
    public List<CardBrandStats> cardBrandDistribution(Instant from, Instant to) {
        return jpaTransactionRepository.groupByCardBrand(from, to).stream()
                .map(o -> {
                    String brand = (String) o[0];
                    long c = ((Number) o[1]).longValue();
                    BigDecimal v = (BigDecimal) o[2];
                    return new CardBrandStats(
                            CardBrand.valueOf(brand),
                            c,
                            v != null ? v : BigDecimal.ZERO);
                })
                .toList();
    }
}
