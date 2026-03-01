package br.com.nomos.dto.dashboard;

public record RiskMatrixCellDTO(
        Integer probability,
        Integer impact,
        Long count,
        String riskLevel) {
}
