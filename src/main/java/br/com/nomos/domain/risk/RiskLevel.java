package br.com.nomos.domain.risk;

import lombok.Getter;

@Getter
public enum RiskLevel {
    BAIXO("Baixo", 1, 8),
    MEDIO("Médio", 9, 17),
    ALTO("Alto", 18, 25);

    private final String descricao;
    private final int minScore;
    private final int maxScore;

    RiskLevel(String descricao, int minScore, int maxScore) {
        this.descricao = descricao;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public static RiskLevel fromScore(int score) {
        for (RiskLevel level : values()) {
            if (score >= level.minScore && score <= level.maxScore) {
                return level;
            }
        }
        return BAIXO; // Default
    }
}
