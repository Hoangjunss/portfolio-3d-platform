package com.portfolio.platform.service;

import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.form.UserCreateForm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserManagementService {

    UserDto create(UserCreateForm form);

    Page<UserDto> list(Pageable pageable);

    Long deactivate(Long id, Long currentUserId);
}
