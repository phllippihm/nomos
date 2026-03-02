package br.com.nomos.dto.action;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record ActionPlanCreateRequestDTO(
        @NotBlank(message = "Descrição é obrigatória") String description,
        UUID executionId,
        List<ActionPlanStepRequestDTO> steps) {
}
