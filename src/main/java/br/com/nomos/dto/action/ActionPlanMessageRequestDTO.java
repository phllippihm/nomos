package br.com.nomos.dto.action;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ActionPlanMessageRequestDTO(
        @NotBlank(message = "Message text is mandatory") String text) {
}
