package br.com.nomos.dto.organization;

import java.util.UUID;

public record CostCenterDTO(UUID id, String nome, String codigo, UUID institutionId) {
}
