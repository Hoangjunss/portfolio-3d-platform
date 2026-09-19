package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.config.MediaStorageProperties;
import com.portfolio.platform.converter.MediaConverter;
import com.portfolio.platform.dto.MediaDto;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.model.Media;
import com.portfolio.platform.repository.MediaRepository;
import com.portfolio.platform.service.MediaService;
import com.portfolio.platform.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class MediaServiceImpl implements MediaService {

    private final MediaRepository mediaRepository;
    private final MediaConverter mediaConverter;
    private final MediaStorageProperties mediaStorageProperties;
    private final UserService userService;

    public MediaServiceImpl(MediaRepository mediaRepository,
                            MediaConverter mediaConverter,
                            MediaStorageProperties mediaStorageProperties,
                            UserService userService) {
        this.mediaRepository = mediaRepository;
        this.mediaConverter = mediaConverter;
        this.mediaStorageProperties = mediaStorageProperties;
        this.userService = userService;
    }

    // Sniffs MIME type from file magic bytes to prevent spoofed Content-Type header from client
    private String detectMimeType(byte[] header) {
        if (header.length >= 8
                && (header[0] & 0xFF) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47
                && header[4] == 0x0D
                && header[5] == 0x0A
                && header[6] == 0x1A
                && header[7] == 0x0A) {
            return "image/png";
        }
        if (header.length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (header.length >= 6
                && header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8'
                && (header[4] == '7' || header[4] == '9') && header[5] == 'a') {
            return "image/gif";
        }
        if (header.length >= 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private String extensionForMimeType(String mimeType) {
        return switch (mimeType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> throw new IllegalArgumentException("Unsupported media type: " + mimeType);
        };
    }

    @Audited(entityType = "Media", action = "CREATE")
    @Transactional
    @Override
    public Long store(MultipartFile file, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > mediaStorageProperties.getMaxSizeBytes()) {
            throw new IllegalArgumentException("File size exceeds maximum limit");
        }

        byte[] header = new byte[12];
        try (InputStream in = file.getInputStream()) {
            int read = in.read(header);
            if (read < 3) {
                throw new IllegalArgumentException("File content is too short");
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        String detectedMimeType = detectMimeType(header);
        if (detectedMimeType == null || !mediaStorageProperties.getAllowedContentTypes().contains(detectedMimeType)) {
            throw new IllegalArgumentException("Disallowed media type");
        }

        String extension = extensionForMimeType(detectedMimeType);
        String storedFileName = UUID.randomUUID() + extension;

        Path uploadDirPath = Path.of(mediaStorageProperties.getUploadDir());
        Path target = uploadDirPath.resolve(storedFileName).normalize();
        if (!target.startsWith(uploadDirPath.normalize())) {
            throw new SecurityException("Path traversal attempt detected");
        }

        try {
            Files.createDirectories(uploadDirPath);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        Long uploaderId = username != null ? userService.findIdByUsername(username).orElse(null) : null;

        Media media = new Media();
        media.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storedFileName);
        media.setUrl("/media/" + storedFileName);
        media.setMimeType(detectedMimeType);
        media.setSizeBytes(file.getSize());
        media.setUploadedBy(uploaderId);

        Media saved = mediaRepository.save(media);
        return saved.getId();
    }

    @Transactional(readOnly = true)
    @Override
    public MediaDto getById(Long id) {
        Media media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media", id));
        return mediaConverter.toDto(media);
    }
}
