package br.com.nomos.dto.action;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ActionPlanDTO(
        UUID id,
        UUID executionId,
        String testName,
        String area,
        String detalhamento,
        String description,
        String status,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime completedAt,
        List<ActionPlanStepDTO> steps,
        List<ActionPlanMessageDTO> messages) {
}
