package com.barak.lifeOS.auth;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.barak.lifeOS.exception.DuplicateResourceException;
import com.barak.lifeOS.exception.ResourceNotFoundException;
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
    private final RefreshTokenService refreshTokenService;

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

        String accessToken = jwtUtil.generateToken(dto.getUsername());
        RefreshToken refreshToken = refreshTokenService.create(user);
        return buildResponse(user, accessToken, refreshToken.getToken());
    }

    public AuthDto.Response login(AuthDto.LoginDto dto){
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
        );

        User user = userRepository.findByUsername(dto.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtUtil.generateToken(dto.getUsername());
        RefreshToken refreshToken = refreshTokenService.create(user);

        return buildResponse(user, accessToken, refreshToken.getToken());
    }

    public AuthDto.Response refresh(AuthDto.RefreshRequest request){
        RefreshToken oldToken = refreshTokenService.validate(request.refreshToken());

        RefreshToken newRefreshToken = refreshTokenService.rotate(oldToken);

        String newAccessToken = jwtUtil.generateToken(oldToken.getUser().getUsername());

        return buildResponse(oldToken.getUser(), newAccessToken, newRefreshToken.getToken());

    }

    public void logout(User currentUser) {
        refreshTokenService.revokeAll(currentUser);
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (DateTimeException e) {
            throw new IllegalArgumentException("Invalid timezone: " + timezone);
        }
    }

    private AuthDto.Response buildResponse(User user, String accessToken, String refreshToken) {
        return new AuthDto.Response(
            accessToken,
            refreshToken,
            new AuthDto.UserSummary(
                user.getId(),
                user.getEmail(),
                user.getUsername()
            )
        );
    }
}
