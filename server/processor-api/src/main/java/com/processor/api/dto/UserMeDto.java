package com.processor.api.dto;

import java.util.List;

public record UserMeDto(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        String displayName,
        String status,
        List<String> roleCodes,
        List<String> permissionCodes
) {
}
