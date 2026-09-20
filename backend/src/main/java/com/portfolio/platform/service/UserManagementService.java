package com.portfolio.platform.service;

import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.form.UserCreateForm;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserManagementService {

    // Returns the id, not the DTO: AuditAspect reads audit_logs.entity_id from the return value
    // and only understands Long. Returning UserDto here left every user-creation audit row with a
    // null entity_id — same contract Template, Media and Lead already follow.
    Long create(UserCreateForm form);

    UserDto getById(Long id);

    Page<UserDto> list(Pageable pageable);

    Long deactivate(Long id, Long currentUserId);
}
