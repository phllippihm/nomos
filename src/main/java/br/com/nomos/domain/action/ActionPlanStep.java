package br.com.nomos.domain.action;

import br.com.nomos.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Table(name = "action_plan_steps")
@Entity(name = "ActionPlanStep")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ActionPlanStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_plan_id", nullable = false)
    private ActionPlan actionPlan;

    @Column(nullable = false)
    private String description;

    @Column
    private String responsible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsibleUser;

    @Column
    private LocalDate deadline;

    @Column(nullable = false)
    private boolean done = false;

    public ActionPlanStep(ActionPlan actionPlan, String description, String responsible, LocalDate deadline) {
        this.actionPlan = actionPlan;
        this.description = description;
        this.responsible = responsible;
        this.deadline = deadline;
    }
}
