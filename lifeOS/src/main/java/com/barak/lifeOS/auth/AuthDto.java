package com.barak.lifeOS.auth;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterDto{
        @NotBlank(message = "First Name is required")
        @Size(max = 50, message = "First Name should not exceed 50 characters")
        private String firstName;

        @NotBlank(message = "Last Name is required")
        @Size(max = 50, message = "Name should not exceed 50 characters")
        private String lastName;

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 75, message = "Username should be between 3 and 75 characters")
        private String username;

        @Email(message = "It must be a valid email")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        private String timezone;
    }

    @Data
    public static class LoginDto{
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;
    }

    public record RefreshRequest(
        @NotBlank String refreshToken
    ) {}

    @Data
    @AllArgsConstructor
    public static class Response{
        private String token;
        private String refresh;
        private UserSummary summary;
    }

    public record UserSummary(UUID id, String email, String username){}
}