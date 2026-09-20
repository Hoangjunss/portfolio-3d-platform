package com.portfolio.platform.controller;

import com.portfolio.platform.enums.LeadStatus;
import com.portfolio.platform.model.Lead;
import com.portfolio.platform.repository.LeadRepository;
import com.portfolio.platform.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminLeadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LeadRepository leadRepository;

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_asAdmin_returnsPageOfLeadsNewestFirst() throws Exception {
        Lead l1 = new Lead();
        l1.setName("Lead 1");
        l1.setEmail("lead1@example.com");
        l1.setStatus(LeadStatus.NEW);
        l1.setCreatedAt(Instant.parse("2026-09-01T10:00:00Z"));
        leadRepository.save(l1);

        Lead l2 = new Lead();
        l2.setName("Lead 2");
        l2.setEmail("lead2@example.com");
        l2.setStatus(LeadStatus.CONTACTED);
        l2.setCreatedAt(Instant.parse("2026-09-02T10:00:00Z"));
        leadRepository.save(l2);

        Lead l3 = new Lead();
        l3.setName("Lead 3");
        l3.setEmail("lead3@example.com");
        l3.setStatus(LeadStatus.CLOSED);
        l3.setCreatedAt(Instant.parse("2026-09-03T10:00:00Z"));
        leadRepository.save(l3);

        mockMvc.perform(get("/api/admin/leads"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.content[0].name").value("Lead 3"))
                .andExpect(jsonPath("$.content[0].status").value("CLOSED"))
                .andExpect(jsonPath("$.content[1].name").value("Lead 2"))
                .andExpect(jsonPath("$.content[1].status").value("CONTACTED"))
                .andExpect(jsonPath("$.content[2].name").value("Lead 1"))
                .andExpect(jsonPath("$.content[2].status").value("NEW"));
    }

    @Test
    @WithMockUser(username = "editor_user", roles = "EDITOR")
    void list_asEditor_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/leads"))
                .andExpect(status().isOk());
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/leads"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "admin_user", roles = "ADMIN")
    void list_neverExposesInternalNote() throws Exception {
        Lead lead = new Lead();
        lead.setName("Secret Lead");
        lead.setEmail("secret@example.com");
        lead.setInternalNote("sensitive internal note");
        lead.setAssignedTo(99L);
        leadRepository.save(lead);

        mockMvc.perform(get("/api/admin/leads"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Secret Lead"))
                .andExpect(jsonPath("$.content[0].internalNote").doesNotExist())
                .andExpect(jsonPath("$.content[0].assignedTo").doesNotExist());
    }
}
