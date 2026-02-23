package br.com.nomos.domain.test;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Table(name = "planning_items")
@Entity(name = "PlanningItem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlanningItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scope_item_id", nullable = false)
    private ScopeItem scopeItem;

    @Column(nullable = false)
    private String mes; // Janeiro, Fevereiro, etc.

    @Column(nullable = false)
    private Integer ano;

    @Column(nullable = false)
    private String status; // Planejado, Realizado, Pendente

    public PlanningItem(ScopeItem scopeItem, String mes, Integer ano, String status) {
        this.scopeItem = scopeItem;
        this.mes = mes;
        this.ano = ano;
        this.status = status;
    }
}
