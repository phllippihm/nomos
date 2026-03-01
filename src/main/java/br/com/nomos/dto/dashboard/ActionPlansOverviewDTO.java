package br.com.nomos.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record ActionPlansOverviewDTO(
                Long totalPlans,
                BigDecimal completionRate,
                Long activePlans,
                List<MonthlyStatsDTO> monthlyStats,
                List<EntityStatsDTO> areaStats,
                List<EntityStatsDTO> directorateStats) {
}
