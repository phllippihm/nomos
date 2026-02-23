package br.com.nomos.domain.test;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Table(name = "execution_records")
@Entity(name = "ExecutionRecord")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ExecutionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scope_item_id", nullable = false)
    private ScopeItem scopeItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_item_id")
    private PlanningItem planningItem;

    @Column(name = "test_date")
    private LocalDateTime testDate;

    private String responsible;

    private Double sampleSize;

    private Double nonConforming;

    private Double conforming;

    @Column(name = "conformity_percentage")
    private BigDecimal conformityPercentage;

    private Double score;

    @Column(columnDefinition = "TEXT")
    private String nonConformities;

    @Column(name = "action_taken")
    private String actionTaken; // E.g., "Plano de ação", "Regularizado"

    public ExecutionRecord(ScopeItem scopeItem, PlanningItem planningItem, LocalDateTime testDate, String responsible) {
        this.scopeItem = scopeItem;
        this.planningItem = planningItem;
        this.testDate = testDate;
        this.responsible = responsible;
    }
}
