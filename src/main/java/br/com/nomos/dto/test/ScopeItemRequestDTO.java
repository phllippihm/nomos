package br.com.nomos.dto.test;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ScopeItemRequestDTO(
                @NotBlank(message = "O nome do teste é obrigatório") String nome,
                String finalidade,
                String tagArea, // Mapeado para frm-descricao no frontend
                @NotNull(message = "A área é obrigatória") UUID areaId,
                String periodicidade, // Ex: Mensal, Bimestral
                String mesInicio, // Ex: Janeiro
                String baseNormativa,
                Integer probabilidade, // Valor de 1 a 5
                Integer impacto // Valor de 1 a 5
) {
}
