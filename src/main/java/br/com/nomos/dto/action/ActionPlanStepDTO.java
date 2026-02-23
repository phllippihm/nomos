package br.com.nomos.dto.action;

import java.util.UUID;

public record ActionPlanStepDTO(
        UUID id,
        String description,
        String responsible,
        String deadline,
        boolean done) {
}
