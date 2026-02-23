package br.com.nomos.dto.test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ExecutionRecordDTO(
        UUID id,
        UUID scopeItemId,
        LocalDateTime testDate,
        String responsible,
        Double sampleSize,
        Double nonConforming,
        Double conforming,
        BigDecimal conformityPercentage,
        Double score,
        String nonConformities,
        String actionTaken) {
}
