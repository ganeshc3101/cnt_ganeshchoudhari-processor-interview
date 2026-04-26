package com.processor.core.repository;

import com.processor.core.model.UserForAuthentication;
import com.processor.core.model.UserProfile;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    Optional<UserForAuthentication> findForAuthenticationByLoginName(String loginName);

    Optional<UserProfile> findProfileById(UUID id);

    void updateLastLogin(UUID id, Instant at);
}
