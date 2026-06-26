package com.barak.lifeOS.common;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.barak.lifeOS.exception.ResourceNotFoundException;
import com.barak.lifeOS.user.User;
import com.barak.lifeOS.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class Helper {
    private final UserRepository userRepository;

    public User getCurrentUser(){
        String username = SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        User user = userRepository.findByUsername(username).
                        orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return user;
    }

}