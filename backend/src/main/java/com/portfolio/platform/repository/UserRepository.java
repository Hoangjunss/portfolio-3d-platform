package com.portfolio.platform.repository;

import com.portfolio.platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    // JPQL bulk updates bypass JPA lifecycle callbacks (@PreUpdate), ensuring
    // last_login_at is stamped without updating updated_at.
    @Modifying
    @Transactional
    @Query("update User u set u.lastLoginAt = :now where u.id = :id")
    int touchLastLoginAt(@Param("id") Long id, @Param("now") Instant now);
}

