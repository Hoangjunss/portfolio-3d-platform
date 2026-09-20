package com.portfolio.platform.controller;

import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.form.UserCreateForm;
import com.portfolio.platform.service.UserManagementService;
import com.portfolio.platform.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserManagementService userManagementService;
    private final UserService userService;

    public AdminUserController(UserManagementService userManagementService, UserService userService) {
        this.userManagementService = userManagementService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserDto> create(@Valid @RequestBody UserCreateForm form) {
        Long id = userManagementService.create(form);
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<UserDto>> list(@PageableDefault(size = 20) Pageable pageable) {
        Page<UserDto> page = userManagementService.list(pageable);
        return ResponseEntity.ok(page);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id, Authentication auth) {
        Long currentUserId = (auth != null)
                ? userService.findIdByUsername(auth.getName()).orElse(null)
                : null;
        userManagementService.deactivate(id, currentUserId);
    }
}
