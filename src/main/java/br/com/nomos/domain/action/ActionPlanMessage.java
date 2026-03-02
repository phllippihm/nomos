package br.com.nomos.domain.action;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Table(name = "action_plan_messages")
@Entity(name = "ActionPlanMessage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ActionPlanMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_plan_id", nullable = false)
    private ActionPlan actionPlan;

    @Column(nullable = false, length = 20)
    private String type; // SYSTEM or USER

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(name = "user_name")
    private String userName;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MessageAttachment> attachments = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime date;

    public ActionPlanMessage(ActionPlan actionPlan, String type, String text, String userName) {
        this.actionPlan = actionPlan;
        this.type = type;
        this.text = text;
        this.userName = userName;
        this.date = LocalDateTime.now();
    }
}
