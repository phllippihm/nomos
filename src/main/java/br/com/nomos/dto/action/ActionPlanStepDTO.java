package br.com.nomos.dto.action;

import java.util.UUID;

public record ActionPlanStepDTO(
        UUID id,
        String description,
        String responsible,
        UUID responsibleId,
        String deadline,
        boolean done) {
}
