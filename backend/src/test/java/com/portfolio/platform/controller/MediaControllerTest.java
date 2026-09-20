package com.portfolio.platform.controller;

import com.portfolio.platform.enums.Role;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.model.Media;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.MediaRepository;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaControllerTest {

    private static final byte[] VALID_PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06
    };

    @TempDir
    static Path tempDir;

    @DynamicPropertySource
    static void registerMediaProps(DynamicPropertyRegistry registry) {
        registry.add("media.upload-dir", () -> tempDir.toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MediaRepository mediaRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @BeforeEach
    void setUp() {
        mediaRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void upload_asEditor_succeedsAndWritesAuditLogRow() throws Exception {
        User editor = userRepository.findByUsername("editor_user").orElseGet(() -> {
            User u = new User();
            u.setUsername("editor_user");
            u.setEmail("editor_user@portfolio.com");
            u.setPasswordHash("hashed");
            u.setRole(Role.EDITOR);
            return userRepository.save(u);
        });

        long auditCountBefore = auditLogRepository.count();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-upload.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/admin/media").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.fileName").value("test-upload.png"))
                .andExpect(jsonPath("$.mimeType").value("image/png"))
                .andExpect(jsonPath("$.url").isNotEmpty());

        assertThat(auditLogRepository.count()).isEqualTo(auditCountBefore + 1);

        AuditLog auditLog = auditLogRepository.findAll().stream()
                .filter(log -> "Media".equals(log.getEntityType()))
                .reduce((first, second) -> second)
                .orElseThrow(() -> new AssertionError("Expected audit log for Media"));

        assertThat(auditLog.getAction()).isEqualTo("CREATE");
        assertThat(auditLog.getUserId()).isEqualTo(editor.getId());

        Media savedMedia = mediaRepository.findById(auditLog.getEntityId()).orElseThrow();
        assertThat(savedMedia.getUploadedBy()).isEqualTo(editor.getId());
        assertThat(savedMedia.getFileName()).isEqualTo("test-upload.png");
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void upload_withDisallowedType_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        MockMultipartFile evil = new MockMultipartFile(
                "file", "evil.html", "text/html",
                "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/admin/media").file(evil))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    void upload_unauthenticated_returns401() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-upload.png",
                "image/png",
                VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/admin/media").file(file))
                .andExpect(status().isUnauthorized());
    }
}
