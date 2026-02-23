package br.com.nomos.dto.organization;

import java.util.UUID;

public record AreaDTO(UUID id, String nome, UUID directorateId) {
}
