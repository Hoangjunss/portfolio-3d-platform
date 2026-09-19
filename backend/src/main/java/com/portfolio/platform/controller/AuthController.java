package com.portfolio.platform.controller;

import com.portfolio.platform.dto.TokenDto;
import com.portfolio.platform.facade.AuthServiceFacade;
import com.portfolio.platform.form.LoginForm;
import com.portfolio.platform.form.RefreshTokenForm;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthServiceFacade authServiceFacade;

    public AuthController(AuthServiceFacade authServiceFacade) {
        this.authServiceFacade = authServiceFacade;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenDto> login(@Valid @RequestBody LoginForm request) {
        return ResponseEntity.ok(authServiceFacade.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenDto> refresh(@Valid @RequestBody RefreshTokenForm request) {
        return ResponseEntity.ok(authServiceFacade.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenForm request) {
        authServiceFacade.logout(request);
        return ResponseEntity.noContent().build();
    }
}
