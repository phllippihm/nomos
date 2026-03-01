package br.com.nomos.dto.dashboard;

import java.math.BigDecimal;

public record MonthlyStatsDTO(
        String month,
        Integer year,
        BigDecimal value,
        Long count) {
}
