package com.portfolio.platform.service;

import com.portfolio.platform.dto.MediaDto;
import org.springframework.web.multipart.MultipartFile;

public interface MediaService {

    Long store(MultipartFile file, String username);

    MediaDto getById(Long id);
}
