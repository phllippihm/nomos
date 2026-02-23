package br.com.nomos.dto.organization;

import java.util.UUID;

public record DirectorateDTO(UUID id, String nome, UUID institutionId) {
}
