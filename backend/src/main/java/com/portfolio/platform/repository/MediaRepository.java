package com.portfolio.platform.repository;

import com.portfolio.platform.model.Media;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaRepository extends JpaRepository<Media, Long> {
}
