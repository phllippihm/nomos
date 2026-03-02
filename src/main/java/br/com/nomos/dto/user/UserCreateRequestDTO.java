package br.com.nomos.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UserCreateRequestDTO(
        @NotBlank String nome,
        @NotBlank @Email String email,
        String senha,
        @NotBlank String role,
        String cargo,
        @NotNull UUID institutionId) {
}
