package br.com.nomos.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record ComplianceDashboardDTO(
                BigDecimal conformityAverage,
                Long testsPerformed,
                List<MonthlyStatsDTO> monthlyStats,
                List<EntityStatsDTO> areaStats,
                List<EntityStatsDTO> directorateStats,
                List<RiskMatrixCellDTO> riskMatrix) {
}
