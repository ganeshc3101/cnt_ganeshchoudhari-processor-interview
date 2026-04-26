package com.processor.core.repository;

import com.processor.core.model.ActivityLogEntry;
import com.processor.core.model.PageResult;

import java.util.UUID;

public interface ActivityLogRepository {

    ActivityLogEntry save(ActivityLogEntry entry);

    PageResult<ActivityLogEntry> findAll(int page, int size);
}
