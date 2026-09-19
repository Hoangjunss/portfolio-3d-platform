package com.portfolio.platform.controller;

import com.portfolio.platform.dto.MediaDto;
import com.portfolio.platform.service.MediaService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaDto> upload(@RequestParam("file") MultipartFile file, Authentication auth) {
        String username = (auth != null) ? auth.getName() : null;
        Long mediaId = mediaService.store(file, username);
        MediaDto dto = mediaService.getById(mediaId);
        return ResponseEntity.ok(dto);
    }
}
