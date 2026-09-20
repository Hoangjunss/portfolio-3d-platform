package com.portfolio.platform.service;

import com.portfolio.platform.converter.UserConverter;
import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.UserCreateForm;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.RefreshTokenRepository;
import com.portfolio.platform.repository.UserRepository;
import com.portfolio.platform.service.impl.UserManagementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserConverter userConverter;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserManagementService userManagementService;

    @BeforeEach
    void setUp() {
        userManagementService = new UserManagementServiceImpl(
                userRepository,
                refreshTokenRepository,
                userConverter,
                passwordEncoder
        );
    }

    @Test
    void create_hashesPasswordBeforeSaving() {
        UserCreateForm form = new UserCreateForm(
                "newuser",
                "newuser@portfolio.com",
                "secretPassword123",
                Role.EDITOR
        );

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@portfolio.com")).thenReturn(false);
        when(passwordEncoder.encode("secretPassword123")).thenReturn("$2a$10$encodedHashValue");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(captor.capture())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        Long result = userManagementService.create(form);

        // The id, not the DTO: AuditAspect fills audit_logs.entity_id from this return value.
        assertThat(result).isEqualTo(1L);
        User savedUser = captor.getValue();
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$10$encodedHashValue");
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("secretPassword123");
        verify(passwordEncoder).encode("secretPassword123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void create_withDuplicateUsername_isRejected() {
        UserCreateForm form = new UserCreateForm(
                "existinguser",
                "other@portfolio.com",
                "secretPassword123",
                Role.EDITOR
        );

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        assertThatThrownBy(() -> userManagementService.create(form))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessage("Username already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void create_withDuplicateEmail_isRejected() {
        UserCreateForm form = new UserCreateForm(
                "brandnewuser",
                "existing@portfolio.com",
                "secretPassword123",
                Role.EDITOR
        );

        when(userRepository.existsByUsername("brandnewuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@portfolio.com")).thenReturn(true);

        assertThatThrownBy(() -> userManagementService.create(form))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessage("Email already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivate_setsActiveFalseAndReturnsId() {
        User target = new User();
        target.setId(2L);
        target.setUsername("editor2");
        target.setRole(Role.EDITOR);
        target.setActive(true);

        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Long deactivatedId = userManagementService.deactivate(2L, 1L);

        assertThat(deactivatedId).isEqualTo(2L);
        assertThat(target.isActive()).isFalse();
        verify(userRepository).save(target);
    }

    @Test
    void deactivate_withUnknownId_throwsResourceNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userManagementService.deactivate(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivate_ownAccount_isRejected() {
        User target = new User();
        target.setId(1L);
        target.setUsername("admin1");
        target.setRole(Role.ADMIN);
        target.setActive(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> userManagementService.deactivate(1L, 1L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessage("Cannot deactivate your own account");

        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivate_lastActiveAdmin_isRejected() {
        User target = new User();
        target.setId(2L);
        target.setUsername("onlyadmin");
        target.setRole(Role.ADMIN);
        target.setActive(true);

        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.countByRoleAndActiveTrue(Role.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> userManagementService.deactivate(2L, 1L))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessage("Cannot deactivate the last active admin");

        verify(userRepository, never()).save(any());
    }

    @Test
    void deactivate_revokesRefreshTokens() {
        User target = new User();
        target.setId(2L);
        target.setUsername("editor2");
        target.setRole(Role.EDITOR);
        target.setActive(true);

        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userManagementService.deactivate(2L, 1L);

        verify(refreshTokenRepository).revokeAllForUser(2L);
    }
}
