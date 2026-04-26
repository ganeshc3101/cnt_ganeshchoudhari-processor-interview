package com.processor.api.repository;

import com.processor.api.entity.ActivityLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JpaActivityLogRepository extends JpaRepository<ActivityLogEntity, UUID> {

    Page<ActivityLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
