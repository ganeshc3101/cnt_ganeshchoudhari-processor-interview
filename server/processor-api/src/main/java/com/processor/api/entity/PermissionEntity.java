package com.processor.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "permissions")
public class PermissionEntity {

    @Id
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 128)
    private String code;

    @Column(name = "resource", nullable = false, length = 64)
    private String resource;

    @Column(name = "action", nullable = false, length = 32)
    private String action;

    @Column(name = "description")
    private String description;

    protected PermissionEntity() {
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }
}
