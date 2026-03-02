package br.com.nomos.dto.action;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ActionPlanStepRequestDTO(
        @NotBlank(message = "Description is mandatory") String description,
        String responsible,
        UUID responsibleId,
        String deadline) {
}
