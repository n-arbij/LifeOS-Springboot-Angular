package com.barak.lifeOS.auth;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.barak.lifeOS.exception.DuplicateResourceException;
import com.barak.lifeOS.security.JwtUtil;
import com.barak.lifeOS.user.User;
import com.barak.lifeOS.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final PasswordValidation passwordValidation;
    private final JwtUtil jwtUtil;

    public AuthDto.Response register(AuthDto.RegisterDto dto){
        if(userRepository.existsByEmail(dto.getUsername())){
            throw new DuplicateResourceException("Email already in use");
        }
        if(userRepository.existsByUsername(dto.getUsername())){
            throw new DuplicateResourceException("Username already in use");
        }
        
        validateTimezone(dto.getTimezone());
        passwordValidation.validate(dto.getPassword());

        User user = new User();
        user.setName(dto.getFirstName() + " " + dto.getLastName());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setTimezone(dto.getTimezone());
        userRepository.save(user);

        String token = jwtUtil.generateToken(dto.getUsername());
        return new AuthDto.Response(token, dto.getUsername());
    }

    public AuthDto.Response login(AuthDto.LoginDto dto){
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
        );
        String token = jwtUtil.generateToken(dto.getUsername());
        return new AuthDto.Response(token, dto.getUsername());
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (DateTimeException e) {
            throw new IllegalArgumentException("Invalid timezone: " + timezone);
        }
    }
}
