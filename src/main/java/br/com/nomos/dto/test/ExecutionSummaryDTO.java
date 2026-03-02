package br.com.nomos.dto.test;

import java.math.BigDecimal;
import java.util.UUID;

public record ExecutionSummaryDTO(
        UUID id,
        String testName,
        String area,
        String date,
        BigDecimal conformityPercentage) {
}
