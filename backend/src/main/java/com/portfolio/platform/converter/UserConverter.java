package com.portfolio.platform.converter;

import com.portfolio.platform.dto.UserDto;
import com.portfolio.platform.model.User;

public interface UserConverter {

    UserDto toDto(User user);
}
