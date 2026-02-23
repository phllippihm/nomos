package br.com.nomos.domain.action;

import br.com.nomos.domain.test.ExecutionRecord;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Table(name = "action_plans")
@Entity(name = "ActionPlan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ActionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    private ExecutionRecord executionRecord;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status; // DRAFT, ACTIVE, COMPLETED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "actionPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActionPlanStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "actionPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ActionPlanMessage> messages = new ArrayList<>();

    public ActionPlan(ExecutionRecord executionRecord, String description, String createdBy) {
        this.executionRecord = executionRecord;
        this.description = description;
        this.status = "DRAFT";
        this.createdAt = LocalDateTime.now();
        this.createdBy = createdBy;
    }

    public void addStep(ActionPlanStep step) {
        steps.add(step);
        step.setActionPlan(this);
    }

    public void addMessage(ActionPlanMessage message) {
        messages.add(message);
        message.setActionPlan(this);
    }
}
