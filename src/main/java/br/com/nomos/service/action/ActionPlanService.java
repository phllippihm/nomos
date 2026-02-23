package br.com.nomos.service.action;

import br.com.nomos.domain.action.ActionPlan;
import br.com.nomos.domain.action.ActionPlanMessage;
import br.com.nomos.domain.action.ActionPlanStep;
import br.com.nomos.dto.action.ActionPlanDTO;
import br.com.nomos.dto.action.ActionPlanMessageDTO;
import br.com.nomos.dto.action.ActionPlanMessageRequestDTO;
import br.com.nomos.dto.action.ActionPlanStepDTO;
import br.com.nomos.dto.action.ActionPlanStepRequestDTO;
import br.com.nomos.dto.action.ActionPlanUpdateRequestDTO;
import br.com.nomos.repository.action.ActionPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ActionPlanService {

    private final ActionPlanRepository actionPlanRepository;

    public ActionPlanService(ActionPlanRepository actionPlanRepository) {
        this.actionPlanRepository = actionPlanRepository;
    }

    public List<ActionPlan> listActionPlans() {
        return actionPlanRepository.findAllByOrderByCreatedAtDesc();
    }

    public ActionPlan getActionPlan(UUID id) {
        return actionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Action Plan not found"));
    }

    @Transactional
    public ActionPlan updateActionPlan(UUID id, ActionPlanUpdateRequestDTO dto) {
        ActionPlan plan = getActionPlan(id);
        plan.setDescription(dto.description());

        // If it was DRAFT and now has a description (meaning the user started filling
        // it out),
        // we can move it to ACTIVE. More robust logic can be added later.
        if ("DRAFT".equals(plan.getStatus()) && dto.description() != null && !dto.description().trim().isEmpty()) {
            plan.setStatus("ACTIVE");
        }

        return actionPlanRepository.save(plan);
    }

    @Transactional
    public ActionPlan finalizePlan(UUID id) {
        ActionPlan plan = getActionPlan(id);
        plan.setStatus("COMPLETED");
        plan.setCompletedAt(LocalDateTime.now());

        plan.addMessage(new ActionPlanMessage(plan, "SYSTEM", "Plano finalizado pelo usuário", "Sistema"));

        return actionPlanRepository.save(plan);
    }

    @Transactional
    public ActionPlanStep addStep(UUID planId, ActionPlanStepRequestDTO dto) {
        ActionPlan plan = getActionPlan(planId);
        ActionPlanStep step = new ActionPlanStep(plan, dto.description(), dto.responsible(), dto.deadline());
        plan.addStep(step);

        if ("DRAFT".equals(plan.getStatus())) {
            plan.setStatus("ACTIVE"); // Ensure it becomes active if a step is added
        }

        actionPlanRepository.save(plan);
        return step;
    }

    @Transactional
    public ActionPlan toggleStep(UUID planId, UUID stepId) {
        ActionPlan plan = getActionPlan(planId);
        ActionPlanStep step = plan.getSteps().stream()
                .filter(s -> s.getId().equals(stepId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Step not found"));

        step.setDone(!step.isDone());
        return actionPlanRepository.save(plan);
    }

    @Transactional
    public ActionPlan removeStep(UUID planId, UUID stepId) {
        ActionPlan plan = getActionPlan(planId);
        plan.getSteps().removeIf(s -> s.getId().equals(stepId));
        return actionPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(UUID id) {
        ActionPlan plan = getActionPlan(id);
        actionPlanRepository.delete(plan);
    }

    @Transactional
    public ActionPlanMessage addMessage(UUID planId, ActionPlanMessageRequestDTO dto) {
        ActionPlan plan = getActionPlan(planId);
        // Note: The userName here is hardcoded for Master Root to keep the initial
        // prototype simple.
        // It will be replaced by the SecurityContext principal name.
        ActionPlanMessage msg = new ActionPlanMessage(plan, "USER", dto.text(), "Master Root");
        plan.addMessage(msg);
        actionPlanRepository.save(plan);
        return msg;
    }

    // Mapper util methods
    public ActionPlanDTO toDTO(ActionPlan plan) {
        String testName = plan.getExecutionRecord() != null && plan.getExecutionRecord().getScopeItem() != null
                ? plan.getExecutionRecord().getScopeItem().getNome()
                : "N/A";
        String area = plan.getExecutionRecord() != null && plan.getExecutionRecord().getScopeItem() != null
                && plan.getExecutionRecord().getScopeItem().getArea() != null
                        ? plan.getExecutionRecord().getScopeItem().getArea().getNome()
                        : "N/A";
        String detalhamento = plan.getExecutionRecord() != null ? plan.getExecutionRecord().getNonConformities() : "";

        List<ActionPlanStepDTO> stepDTOs = plan.getSteps().stream()
                .map(s -> new ActionPlanStepDTO(s.getId(), s.getDescription(), s.getResponsible(), s.getDeadline(),
                        s.isDone()))
                .toList();

        List<ActionPlanMessageDTO> messageDTOs = plan.getMessages().stream()
                .map(m -> new ActionPlanMessageDTO(
                        m.getId(),
                        m.getType(),
                        m.getText(),
                        m.getUserName(),
                        java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(m.getDate())))
                .toList();

        return new ActionPlanDTO(
                plan.getId(),
                plan.getExecutionRecord() != null ? plan.getExecutionRecord().getId() : null,
                testName,
                area,
                detalhamento,
                plan.getDescription(),
                plan.getStatus(),
                plan.getCreatedAt(),
                plan.getCreatedBy(),
                plan.getCompletedAt(),
                stepDTOs,
                messageDTOs);
    }
}
