package br.com.nomos.dto.dashboard;

import java.math.BigDecimal;

public record EntityStatsDTO(
        String name,
        BigDecimal value,
        Long count) {
}
