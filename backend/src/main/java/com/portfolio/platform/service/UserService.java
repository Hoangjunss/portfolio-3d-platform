package com.portfolio.platform.service;

import com.portfolio.platform.model.User;

import java.util.Optional;

public interface UserService {

    Optional<User> findActiveByUsername(String username);

    Optional<User> findByUsername(String username);

    boolean verifyPassword(User user, String rawPassword);

    void touchLastLoginAt(Long userId);
}
