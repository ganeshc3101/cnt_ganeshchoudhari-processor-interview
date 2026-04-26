package com.processor.api.controller;

import com.processor.api.dto.CardBrandStatsDto;
import com.processor.api.dto.DailyVolumePointDto;
import com.processor.api.dto.DashboardMetricsDto;
import com.processor.api.service.ReportApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportApplicationService reportApplicationService;

    public ReportController(ReportApplicationService reportApplicationService) {
        this.reportApplicationService = reportApplicationService;
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAuthority('REPORTS_READ')")
    public ResponseEntity<DashboardMetricsDto> metrics(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(reportApplicationService.metrics(from, to));
    }

    @GetMapping("/daily-volume")
    @PreAuthorize("hasAuthority('REPORTS_READ')")
    public ResponseEntity<List<DailyVolumePointDto>> dailyVolume(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(reportApplicationService.dailyVolume(from, to));
    }

    @GetMapping("/card-distribution")
    @PreAuthorize("hasAuthority('REPORTS_READ')")
    public ResponseEntity<List<CardBrandStatsDto>> cardDistribution(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return ResponseEntity.ok(reportApplicationService.cardDistribution(from, to));
    }
}
