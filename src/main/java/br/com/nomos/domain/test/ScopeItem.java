package br.com.nomos.domain.test;

import br.com.nomos.domain.organization.Area;
import br.com.nomos.domain.risk.RiskLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Table(name = "scope_items")
@Entity(name = "ScopeItem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ScopeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String finalidade;

    @Column(name = "tag_area")
    private String tagArea;

    @Column(length = 50)
    private String periodicidade; // e.g., Mensal, Bimestral

    @Column(name = "mes_inicio", length = 20)
    private String mesInicio; // e.g., Janeiro

    @Column(columnDefinition = "TEXT")
    private String baseNormativa;

    @Column(columnDefinition = "int default 1")
    private Integer probabilidade = 1;

    @Column(columnDefinition = "int default 1")
    private Integer impacto = 1;

    @Column(name = "risk_score", columnDefinition = "int default 1")
    private Integer riskScore = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level")
    private RiskLevel riskLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    public ScopeItem(String nome, String finalidade, Area area, String periodicidade, String mesInicio,
            String baseNormativa,
            Integer probabilidade, Integer impacto) {
        this.nome = nome;
        this.finalidade = finalidade;
        this.area = area;
        this.periodicidade = periodicidade;
        this.mesInicio = mesInicio;
        this.baseNormativa = baseNormativa;
        this.probabilidade = probabilidade != null ? probabilidade : 1;
        this.impacto = impacto != null ? impacto : 1;
        this.riskScore = this.probabilidade * this.impacto;
        this.riskLevel = RiskLevel.fromScore(this.riskScore);
    }

    public void updateRisk() {
        this.riskScore = (this.probabilidade != null ? this.probabilidade : 1)
                * (this.impacto != null ? this.impacto : 1);
        this.riskLevel = RiskLevel.fromScore(this.riskScore);
    }
}
