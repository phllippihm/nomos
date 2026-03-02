package br.com.nomos.dto.test;

import java.util.UUID;

public record PlanningItemDTO(
                UUID id,
                UUID scopeItemId,
                String testName,
                String area,
                String diretoria,
                String riskLevel,
                String mes,
                Integer ano,
                String status,
                String responsavel,
                Double compliance,
                String conformityLevel,
                String conformityColor) {
}
