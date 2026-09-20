package com.portfolio.platform.service;

import com.portfolio.platform.config.MediaStorageProperties;
import com.portfolio.platform.converter.MediaConverter;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.model.Media;
import com.portfolio.platform.repository.MediaRepository;
import com.portfolio.platform.service.impl.MediaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    private static final byte[] VALID_PNG_BYTES = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06
    };

    private static final byte[] VALID_WEBP_BYTES = new byte[]{
            'R', 'I', 'F', 'F', 0x1A, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P',
            'V', 'P', '8', ' ', 0x0E, 0x00, 0x00, 0x00
    };

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private MediaConverter mediaConverter;

    @Spy
    private MediaStorageProperties mediaStorageProperties = new MediaStorageProperties();

    @Mock
    private UserService userService;

    @InjectMocks
    private MediaServiceImpl mediaService;

    /** A MultipartFile whose stream returns at most 4 bytes per read — what a file- or
     *  network-backed multipart is allowed to do, and what MockMultipartFile never does. */
    private record DripFedMultipartFile(byte[] content) implements MultipartFile {
        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return "drip.webp"; }
        @Override public String getContentType() { return "image/webp"; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content; }
        @Override public InputStream getInputStream() {
            return new FilterInputStream(new ByteArrayInputStream(content)) {
                @Override public int read(byte[] b, int off, int len) throws IOException {
                    return super.read(b, off, Math.min(len, 4));
                }
            };
        }
        @Override public void transferTo(java.io.File dest) { throw new UnsupportedOperationException(); }
    }

    @Test
    void store_withTraversalFilename_doesNotEscapeUploadDir(@TempDir Path tempDir) throws Exception {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(10L);
            return m;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../../../tmp/pwn.png",
                "image/png",
                VALID_PNG_BYTES
        );

        Long mediaId = mediaService.store(file, "admin");
        assertThat(mediaId).isNotNull();

        List<Path> filesInUploadDir;
        try (Stream<Path> stream = Files.list(tempDir)) {
            filesInUploadDir = stream.toList();
        }
        assertThat(filesInUploadDir).hasSize(1);
        Path storedFile = filesInUploadDir.get(0);
        assertThat(storedFile.toRealPath().startsWith(tempDir.toRealPath())).isTrue();
        assertThat(storedFile.getFileName().toString()).doesNotContain("pwn");

        Path traversalTarget = tempDir.resolve("../../../../tmp/pwn.png").normalize();
        assertThat(Files.exists(traversalTarget)).isFalse();
    }

    @Test
    void store_withDisallowedType_isRejected(@TempDir Path tempDir) throws Exception {
        mediaStorageProperties.setUploadDir(tempDir.toString());

        MockMultipartFile evilFile = new MockMultipartFile(
                "file",
                "evil.html",
                "text/html",
                "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> mediaService.store(evilFile, "admin"))
                .isInstanceOf(InvalidRequestException.class);

        verify(mediaRepository, never()).save(any());
        try (Stream<Path> stream = Files.list(tempDir)) {
            assertThat(stream.toList()).isEmpty();
        }
    }

    @Test
    void store_withSvgContentDeclaredAsPng_isRejected(@TempDir Path tempDir) throws Exception {
        mediaStorageProperties.setUploadDir(tempDir.toString());

        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file",
                "evil.svg",
                "image/png",
                "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> mediaService.store(spoofedFile, "admin"))
                .isInstanceOf(InvalidRequestException.class);

        verify(mediaRepository, never()).save(any());
        try (Stream<Path> stream = Files.list(tempDir)) {
            assertThat(stream.toList()).isEmpty();
        }
    }

    @Test
    void store_withRealPngDeclaredAsTextHtml_persistsSniffedMimeType(@TempDir Path tempDir) {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(10L);
            return m;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file", "innocent.png", "text/html", VALID_PNG_BYTES);

        mediaService.store(file, "admin");

        ArgumentCaptor<Media> captor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository).save(captor.capture());
        assertThat(captor.getValue().getMimeType()).isEqualTo("image/png");
        assertThat(captor.getValue().getUrl()).endsWith(".png");
    }

    @Test
    void store_whenStreamReturnsShortReads_stillDetectsWebp(@TempDir Path tempDir) {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(1L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(11L);
            return m;
        });

        mediaService.store(new DripFedMultipartFile(VALID_WEBP_BYTES), "admin");

        ArgumentCaptor<Media> captor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository).save(captor.capture());
        assertThat(captor.getValue().getMimeType()).isEqualTo("image/webp");
    }

    @Test
    void store_persistsUploaderId(@TempDir Path tempDir) {
        mediaStorageProperties.setUploadDir(tempDir.toString());
        when(userService.findIdByUsername("admin")).thenReturn(Optional.of(42L));
        when(mediaRepository.save(any(Media.class))).thenAnswer(inv -> {
            Media m = inv.getArgument(0);
            m.setId(10L);
            return m;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "valid.png",
                "image/png",
                VALID_PNG_BYTES
        );

        Long mediaId = mediaService.store(file, "admin");
        assertThat(mediaId).isEqualTo(10L);

        ArgumentCaptor<Media> captor = ArgumentCaptor.forClass(Media.class);
        verify(mediaRepository).save(captor.capture());
        Media saved = captor.getValue();
        assertThat(saved.getUploadedBy()).isEqualTo(42L);
    }
}
