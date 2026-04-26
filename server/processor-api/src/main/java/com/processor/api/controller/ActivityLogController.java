package com.processor.api.controller;

import com.processor.api.dto.ActivityLogRequestDto;
import com.processor.api.dto.ActivityLogResponseDto;
import com.processor.api.dto.PageResponseDto;
import com.processor.api.service.ActivityLogApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/activity-logs")
public class ActivityLogController {

    private final ActivityLogApplicationService activityLogApplicationService;

    public ActivityLogController(ActivityLogApplicationService activityLogApplicationService) {
        this.activityLogApplicationService = activityLogApplicationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUDIT_LOGS_READ')")
    public ResponseEntity<PageResponseDto<ActivityLogResponseDto>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(activityLogApplicationService.list(page, size));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AUDIT_LOGS_WRITE')")
    public ResponseEntity<ActivityLogResponseDto> post(@Valid @RequestBody ActivityLogRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activityLogApplicationService.post(request));
    }
}
