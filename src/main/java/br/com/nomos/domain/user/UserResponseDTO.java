package br.com.nomos.domain.user;

import java.util.UUID;

public record UserResponseDTO(UUID id, String nome, String email, String role, String institutionId,
        String institutionName) {
    public UserResponseDTO(User user) {
        this(user.getId(), user.getNome(), user.getEmail(), user.getRole().name(),
                user.getInstitution().getId().toString(), user.getInstitution().getNome());
    }
}
