package com.processor.api.repository;

import com.processor.api.entity.PermissionEntity;
import com.processor.api.entity.RoleEntity;
import com.processor.api.entity.UserEntity;
import com.processor.core.model.UserForAuthentication;
import com.processor.core.model.UserProfile;
import com.processor.core.repository.UserRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final JpaUserRepository jpa;

    public UserRepositoryImpl(JpaUserRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<UserForAuthentication> findForAuthenticationByLoginName(String loginName) {
        if (loginName == null || loginName.isBlank()) {
            return Optional.empty();
        }
        return jpa.findByLoginName(loginName.trim())
                .map(u -> new UserForAuthentication(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getStatus(),
                        u.getPasswordHash()));
    }

    @Override
    public Optional<UserProfile> findProfileById(UUID id) {
        return jpa.findByIdWithGraph(id).map(this::toProfile);
    }

    @Override
    @Transactional
    public void updateLastLogin(UUID id, Instant at) {
        jpa.findById(id).ifPresent(u -> {
            u.setLastLoginAt(at);
            u.setUpdatedAt(at);
            jpa.save(u);
        });
    }

    private UserProfile toProfile(UserEntity u) {
        List<String> roleCodes = u.getRoles().stream()
                .map(RoleEntity::getCode)
                .sorted()
                .toList();
        Set<String> perms = new LinkedHashSet<>();
        for (RoleEntity r : u.getRoles()) {
            for (PermissionEntity p : r.getPermissions()) {
                perms.add(p.getCode());
            }
        }
        List<String> permissionCodes = perms.stream().sorted().toList();
        return new UserProfile(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getDisplayName(),
                u.getStatus(),
                new ArrayList<>(roleCodes),
                permissionCodes
        );
    }
}
