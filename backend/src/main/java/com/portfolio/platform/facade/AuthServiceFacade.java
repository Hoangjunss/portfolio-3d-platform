package com.portfolio.platform.facade;

import com.portfolio.platform.dto.TokenDto;
import com.portfolio.platform.form.LoginForm;
import com.portfolio.platform.form.RefreshTokenForm;

public interface AuthServiceFacade {

    TokenDto login(LoginForm form);

    TokenDto refresh(RefreshTokenForm form);

    void logout(RefreshTokenForm form);
}
