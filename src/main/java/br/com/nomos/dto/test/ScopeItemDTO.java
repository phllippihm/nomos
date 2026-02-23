package br.com.nomos.dto.test;

import br.com.nomos.domain.risk.RiskLevel;
import java.util.UUID;

public record ScopeItemDTO(
        UUID id,
        String nome,
        String finalidade,
        String tagArea,
        String periodicidade,
        String mesInicio,
        String baseNormativa,
        Integer probabilidade,
        Integer impacto,
        Integer riskScore,
        RiskLevel riskLevel,
        UUID areaId) {
}
