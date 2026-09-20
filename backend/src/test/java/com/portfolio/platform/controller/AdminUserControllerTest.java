package com.portfolio.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.form.UserCreateForm;
import com.portfolio.platform.model.AuditLog;
import com.portfolio.platform.repository.AuditLogRepository;
import com.portfolio.platform.repository.SystemErrorLogRepository;
import com.portfolio.platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemErrorLogRepository systemErrorLogRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void create_asAdmin_returns201AndUserDtoWithoutPasswordHash() throws Exception {
        UserCreateForm form = new UserCreateForm(
                "neweditor",
                "neweditor@portfolio.com",
                "securePassword123",
                Role.EDITOR
        );

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.username").value("neweditor"))
                .andExpect(jsonPath("$.email").value("neweditor@portfolio.com"))
                .andExpect(jsonPath("$.role").value("EDITOR"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void create_writesAuditRowCarryingTheNewUserId() throws Exception {
        UserCreateForm form = new UserCreateForm(
                "auditeditor", "auditeditor@portfolio.com", "securePassword123", Role.EDITOR);

        String body = mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long createdId = objectMapper.readTree(body).get("id").asLong();

        AuditLog row = auditLogRepository.findAll().stream()
                .filter(l -> "User".equals(l.getEntityType()) && "CREATE".equals(l.getAction()))
                .reduce((first, second) -> second)
                .orElseThrow(() -> new AssertionError("Expected an audit row for User CREATE"));

        // AuditAspect reads entity_id from the service return value and only understands Long.
        // A service returning UserDto silently left this null — spec section 6 requires the row.
        assertThat(row.getEntityId()).isEqualTo(createdId);
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void create_asEditor_returns403() throws Exception {
        UserCreateForm form = new UserCreateForm(
                "editorattempt",
                "editorattempt@portfolio.com",
                "securePassword123",
                Role.EDITOR
        );

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void create_withShortPassword_returns400AndWritesNoErrorLog() throws Exception {
        long errorLogsBefore = systemErrorLogRepository.count();

        UserCreateForm form = new UserCreateForm(
                "validuser",
                "valid@portfolio.com",
                "short",
                Role.EDITOR
        );

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(form)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(systemErrorLogRepository.count()).isEqualTo(errorLogsBefore);
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_asAdmin_returnsPageWithDefaultSize() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.content").isArray());
    }
}
