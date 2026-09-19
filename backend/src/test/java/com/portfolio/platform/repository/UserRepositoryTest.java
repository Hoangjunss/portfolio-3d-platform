package com.portfolio.platform.repository;

import com.portfolio.platform.enums.Role;
import com.portfolio.platform.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    TestEntityManager entityManager;

    @Test
    void findByUsername_returnsSavedUser() {
        User user = new User();
        user.setUsername("admin");
        user.setEmail("admin@portfolio.com");
        user.setPasswordHash("hashed");
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        var found = userRepository.findByUsername("admin");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("admin@portfolio.com");
    }

    @Test
    void updatedAt_movesForwardOnUpdate() throws Exception {
        User user = new User();
        user.setUsername("editor");
        user.setEmail("editor@portfolio.com");
        user.setPasswordHash("hashed");
        user.setRole(Role.EDITOR);
        userRepository.saveAndFlush(user);

        var createdUpdatedAt = user.getUpdatedAt();

        // Instant.now() can return the same value twice within one clock tick; the point of the
        // assertion is that the callback fires, not how fast the two writes happen.
        Thread.sleep(10);

        user.setEmail("editor2@portfolio.com");
        userRepository.saveAndFlush(user);
        entityManager.clear();

        var reloaded = userRepository.findByUsername("editor").orElseThrow();
        assertThat(reloaded.getUpdatedAt()).isAfter(createdUpdatedAt);
    }
}
