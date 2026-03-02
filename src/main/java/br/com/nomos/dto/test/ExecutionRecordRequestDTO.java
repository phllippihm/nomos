package br.com.nomos.dto.test;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ExecutionRecordRequestDTO(
        UUID planningItemId,
        @NotNull(message = "O scope item é obrigatório") UUID scopeItemId,
        @NotNull(message = "O tamanho da amostra é obrigatório") @Min(value = 1, message = "O tamanho da amostra deve ser maior que zero") Double sampleSize,
        @NotNull(message = "A quantidade de não-conformes é obrigatória") @Min(value = 0, message = "Não-conformes não pode ser negativo") Double nonConforming,
        String nonConformities,
        String actionTaken) {
}
