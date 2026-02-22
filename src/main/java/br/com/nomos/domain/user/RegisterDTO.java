package br.com.nomos.domain.user;

public record RegisterDTO(String nome, String email, String senha, UserRole role, String instituicao) {
}
