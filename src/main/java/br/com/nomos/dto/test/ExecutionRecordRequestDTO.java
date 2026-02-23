package br.com.nomos.dto.test;

import java.util.UUID;

public record ExecutionRecordRequestDTO(
        UUID planningItemId,
        UUID scopeItemId,
        Double sampleSize,
        Double nonConforming,
        String nonConformities,
        String actionTaken) {
}
