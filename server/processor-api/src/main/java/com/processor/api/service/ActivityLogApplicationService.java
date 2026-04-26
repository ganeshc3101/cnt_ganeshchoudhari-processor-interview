package com.processor.api.service;

import com.processor.api.dto.ActivityLogRequestDto;
import com.processor.api.dto.ActivityLogResponseDto;
import com.processor.api.dto.PageResponseDto;
import com.processor.core.model.ActivityLogEntry;
import com.processor.core.model.PageResult;
import com.processor.core.repository.ActivityLogRepository;
import com.processor.api.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class ActivityLogApplicationService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogApplicationService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ActivityLogResponseDto> list(int page, int size) {
        PageResult<ActivityLogEntry> p = activityLogRepository.findAll(page, size);
        return new PageResponseDto<>(
                p.content().stream().map(this::toDto).toList(),
                p.page(),
                p.size(),
                p.totalElements(),
                p.totalPages()
        );
    }

    @Transactional
    public ActivityLogResponseDto post(ActivityLogRequestDto request) {
        UUID uid = SecurityUtils.currentUserId().orElse(null);
        ActivityLogEntry e = new ActivityLogEntry(
                UUID.randomUUID(),
                uid,
                null,
                request.action(),
                request.resourceType(),
                null,
                "SUCCESS",
                request.message(),
                request.metadata() != null ? new java.util.HashMap<>(request.metadata()) : null,
                Instant.now()
        );
        return toDto(activityLogRepository.save(e));
    }

    private ActivityLogResponseDto toDto(ActivityLogEntry e) {
        return new ActivityLogResponseDto(
                e.id() != null ? e.id().toString() : null,
                e.userId() != null ? e.userId().toString() : null,
                e.username(),
                e.action(),
                e.resourceType(),
                e.resourceId() != null ? e.resourceId().toString() : null,
                e.status(),
                e.message(),
                e.metadata(),
                e.createdAt()
        );
    }
}
