package br.com.nomos.dto.test;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ScopeItemRequestDTO(
                @NotBlank(message = "O nome do teste é obrigatório") String nome,
                String finalidade,
                String tagArea,
                @NotNull(message = "A área é obrigatória") UUID areaId,
                @NotBlank(message = "A periodicidade é obrigatória") String periodicidade,
                @NotBlank(message = "O mês de início é obrigatório") String mesInicio,
                String baseNormativa,
                @NotNull(message = "A probabilidade é obrigatória") @Min(1) @Max(5) Integer probabilidade,
                @NotNull(message = "O impacto é obrigatório") @Min(1) @Max(5) Integer impacto,
                String procedimentos,
                UUID costCenterId) {
}
