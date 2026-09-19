package com.portfolio.platform.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

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
}
