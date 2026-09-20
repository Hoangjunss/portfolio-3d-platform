package com.portfolio.platform.repository;

import com.portfolio.platform.model.Setting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SettingRepository extends JpaRepository<Setting, Long> {

    Optional<Setting> findByKey(String key);

    List<Setting> findAllByKeyIn(List<String> keys);
}
