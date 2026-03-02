package br.com.nomos.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record HomeSummaryDTO(
        long totalPlanejados,
        long totalRealizados,
        long totalPendentes,
        BigDecimal avgConformidade,
        long actionPlansDraft,
        long actionPlansActive,
        long actionPlansCompleted,
        List<PendingTestDTO> pendingTests) {

    public record PendingTestDTO(
            UUID planningItemId,
            UUID scopeItemId,
            String testName,
            String area,
            String diretoria,
            String mes,
            int ano,
            String riskLevel) {
    }
}
