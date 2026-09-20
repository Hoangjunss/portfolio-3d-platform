package com.portfolio.platform.controller;

import com.portfolio.platform.dto.SystemErrorLogDto;
import com.portfolio.platform.service.SystemErrorLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/error-logs")
public class AdminErrorLogController {

    private final SystemErrorLogService systemErrorLogService;

    public AdminErrorLogController(SystemErrorLogService systemErrorLogService) {
        this.systemErrorLogService = systemErrorLogService;
    }

    @GetMapping
    public ResponseEntity<Page<SystemErrorLogDto>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(systemErrorLogService.list(pageable));
    }
}
