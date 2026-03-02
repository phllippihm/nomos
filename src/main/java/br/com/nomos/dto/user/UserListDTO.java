package br.com.nomos.dto.user;

import java.util.UUID;

public record UserListDTO(UUID id, String nome, String email, String role) {
}
