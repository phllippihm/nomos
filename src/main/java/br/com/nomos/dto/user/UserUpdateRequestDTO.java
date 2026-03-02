package br.com.nomos.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequestDTO(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank String role,
        String cargo,
        String status) {
}
