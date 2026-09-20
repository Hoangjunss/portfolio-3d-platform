package com.portfolio.platform.service.impl;

import com.portfolio.platform.annotation.Audited;
import com.portfolio.platform.converter.UserConverter;
import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.enums.Role;
import com.portfolio.platform.exception.InvalidRequestException;
import com.portfolio.platform.exception.ResourceNotFoundException;
import com.portfolio.platform.form.UserCreateForm;
import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.RefreshTokenRepository;
import com.portfolio.platform.repository.UserRepository;
import com.portfolio.platform.service.UserManagementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserConverter userConverter;
    private final PasswordEncoder passwordEncoder;

    public UserManagementServiceImpl(UserRepository userRepository,
                                    RefreshTokenRepository refreshTokenRepository,
                                    UserConverter userConverter,
                                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userConverter = userConverter;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    @Audited(entityType = "User", action = "CREATE")
    public Long create(UserCreateForm form) {
        if (userRepository.existsByUsername(form.username())) {
            throw new InvalidRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(form.email())) {
            throw new InvalidRequestException("Email already registered");
        }

        User user = new User();
        user.setUsername(form.username());
        user.setEmail(form.email());
        user.setPasswordHash(passwordEncoder.encode(form.password()));
        user.setRole(form.role());
        user.setActive(true);

        User saved = userRepository.save(user);
        return saved.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getById(Long id) {
        return userRepository.findById(id)
                .map(userConverter::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> list(Pageable pageable) {
        return userRepository.findAll(pageable).map(userConverter::toDto);
    }

    @Override
    @Transactional
    @Audited(entityType = "User", action = "DELETE")
    public Long deactivate(Long id, Long currentUserId) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (target.getId().equals(currentUserId)) {
            throw new InvalidRequestException("Cannot deactivate your own account");
        }

        if (target.getRole() == Role.ADMIN && target.isActive()) {
            long activeAdminCount = userRepository.countByRoleAndActiveTrue(Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new InvalidRequestException("Cannot deactivate the last active admin");
            }
        }

        target.setActive(false);
        userRepository.save(target);

        refreshTokenRepository.revokeAllForUser(target.getId());

        return target.getId();
    }
}
