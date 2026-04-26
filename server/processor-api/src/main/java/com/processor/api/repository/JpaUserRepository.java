package com.processor.api.repository;

import com.processor.api.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface JpaUserRepository extends JpaRepository<UserEntity, UUID> {

    @Query("select distinct u from UserEntity u left join fetch u.roles r left join fetch r.permissions "
            + "where lower(u.username) = lower(:q) or lower(u.email) = lower(:q)")
    Optional<UserEntity> findByLoginName(@Param("q") String q);

    @Query("select distinct u from UserEntity u left join fetch u.roles r left join fetch r.permissions where u.id = :id")
    Optional<UserEntity> findByIdWithGraph(@Param("id") UUID id);
}
