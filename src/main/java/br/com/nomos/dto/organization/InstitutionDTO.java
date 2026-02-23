package br.com.nomos.dto.organization;

import java.util.UUID;

public record InstitutionDTO(UUID id, String nome, boolean ativo) {
}
