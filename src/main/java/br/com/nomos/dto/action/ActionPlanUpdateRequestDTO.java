package br.com.nomos.dto.action;

import jakarta.validation.constraints.NotBlank;

public record ActionPlanUpdateRequestDTO(
        @NotBlank(message = "Description is mandatory") String description) {
}
