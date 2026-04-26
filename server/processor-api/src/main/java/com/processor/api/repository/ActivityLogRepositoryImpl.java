package com.processor.api.repository;

import com.processor.api.entity.ActivityLogEntity;
import com.processor.core.model.ActivityLogEntry;
import com.processor.core.model.PageResult;
import com.processor.core.repository.ActivityLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
public class ActivityLogRepositoryImpl implements ActivityLogRepository {

    private final JpaActivityLogRepository jpa;

    public ActivityLogRepositoryImpl(JpaActivityLogRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public ActivityLogEntry save(ActivityLogEntry entry) {
        ActivityLogEntity e = new ActivityLogEntity();
        e.setId(entry.id() != null ? entry.id() : UUID.randomUUID());
        e.setUserId(entry.userId());
        e.setUsername(entry.username());
        e.setAction(entry.action());
        e.setResourceType(entry.resourceType());
        e.setResourceId(entry.resourceId());
        e.setStatus(entry.status());
        e.setMessage(entry.message());
        e.setMetadata(entry.metadata() != null ? new HashMap<>(entry.metadata()) : null);
        e.setCreatedAt(entry.createdAt() != null ? entry.createdAt() : Instant.now());
        ActivityLogEntity saved = jpa.save(e);
        return toEntry(saved);
    }

    @Override
    public PageResult<ActivityLogEntry> findAll(int page, int size) {
        int s = size <= 0 ? 20 : Math.min(size, 200);
        int p = Math.max(0, page);
        Page<ActivityLogEntity> result = jpa.findAllByOrderByCreatedAtDesc(PageRequest.of(p, s));
        return PageResult.of(
                result.getContent().stream().map(this::toEntry).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements());
    }

    private ActivityLogEntry toEntry(ActivityLogEntity e) {
        Map<String, Object> meta = e.getMetadata() != null ? new HashMap<>(e.getMetadata()) : null;
        return new ActivityLogEntry(
                e.getId(),
                e.getUserId(),
                e.getUsername(),
                e.getAction(),
                e.getResourceType(),
                e.getResourceId(),
                e.getStatus(),
                e.getMessage(),
                meta,
                e.getCreatedAt()
        );
    }
}
