package com.processor.api.repository;

import com.processor.api.entity.AuthSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JpaAuthSessionRepository extends JpaRepository<AuthSessionEntity, UUID> {
}
