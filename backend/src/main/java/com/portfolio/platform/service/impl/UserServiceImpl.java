package com.portfolio.platform.service.impl;

import com.portfolio.platform.model.User;
import com.portfolio.platform.repository.UserRepository;
import com.portfolio.platform.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findActiveByUsername(String username) {
        return userRepository.findByUsername(username).filter(User::isActive);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean verifyPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    // JPQL bulk updates bypass JPA lifecycle callbacks (@PreUpdate), ensuring
    // last_login_at is stamped without updating updated_at.
    @Override
    @Transactional
    public void touchLastLoginAt(Long userId) {
        userRepository.touchLastLoginAt(userId, Instant.now());
    }
}
