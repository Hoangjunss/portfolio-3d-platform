package com.portfolio.platform.facade.impl;

import com.portfolio.platform.converter.TokenConverter;
import com.portfolio.platform.dto.RotationDto;
import com.portfolio.platform.dto.TokenDto;
import com.portfolio.platform.exception.InvalidCredentialsException;
import com.portfolio.platform.facade.AuthServiceFacade;
import com.portfolio.platform.form.LoginForm;
import com.portfolio.platform.form.RefreshTokenForm;
import com.portfolio.platform.model.User;
import com.portfolio.platform.service.JwtService;
import com.portfolio.platform.service.RefreshTokenService;
import com.portfolio.platform.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceFacadeImpl implements AuthServiceFacade {

    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final TokenConverter tokenConverter;

    public AuthServiceFacadeImpl(UserService userService, JwtService jwtService,
                                 RefreshTokenService refreshTokenService, TokenConverter tokenConverter) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.tokenConverter = tokenConverter;
    }

    @Override
    public TokenDto login(LoginForm form) {
        User user = userService.authenticate(form.username(), form.password())
                .orElseThrow(InvalidCredentialsException::new);

        userService.touchLastLoginAt(user.getId());

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = refreshTokenService.issue(user.getId());

        return tokenConverter.toDto(accessToken, rawRefreshToken);
    }

    @Override
    public TokenDto refresh(RefreshTokenForm form) {
        RotationDto rotation = refreshTokenService.rotate(form.refreshToken())
                .orElseThrow(InvalidCredentialsException::new);

        String accessToken = jwtService.generateAccessToken(rotation.user());
        return tokenConverter.toDto(accessToken, rotation.rawRefreshToken());
    }

    // Always succeeds (204): telling the caller whether a row matched would turn this into a
    // token-validity oracle.
    @Override
    public void logout(RefreshTokenForm form) {
        refreshTokenService.revoke(form.refreshToken());
    }
}
