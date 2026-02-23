package br.com.nomos.controller.api;

import br.com.nomos.dto.action.ActionPlanDTO;
import br.com.nomos.dto.action.ActionPlanMessageDTO;
import br.com.nomos.dto.action.ActionPlanMessageRequestDTO;
import br.com.nomos.dto.action.ActionPlanStepDTO;
import br.com.nomos.dto.action.ActionPlanStepRequestDTO;
import br.com.nomos.dto.action.ActionPlanUpdateRequestDTO;
import br.com.nomos.service.action.ActionPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/action-plans")
public class ActionPlanController {

    private final ActionPlanService actionPlanService;

    public ActionPlanController(ActionPlanService actionPlanService) {
        this.actionPlanService = actionPlanService;
    }

    @GetMapping
    public List<ActionPlanDTO> listActionPlans() {
        return actionPlanService.listActionPlans().stream()
                .map(actionPlanService::toDTO)
                .toList();
    }

    @GetMapping("/{id}")
    public ActionPlanDTO getActionPlan(@PathVariable UUID id) {
        return actionPlanService.toDTO(actionPlanService.getActionPlan(id));
    }

    @PutMapping("/{id}")
    public ActionPlanDTO updateActionPlan(@PathVariable UUID id, @RequestBody @Valid ActionPlanUpdateRequestDTO dto) {
        return actionPlanService.toDTO(actionPlanService.updateActionPlan(id, dto));
    }

    @PutMapping("/{id}/finalize")
    public ActionPlanDTO finalizeActionPlan(@PathVariable UUID id) {
        return actionPlanService.toDTO(actionPlanService.finalizePlan(id));
    }

    @PostMapping("/{id}/steps")
    @ResponseStatus(HttpStatus.CREATED)
    public ActionPlanStepDTO addStep(@PathVariable UUID id, @RequestBody @Valid ActionPlanStepRequestDTO dto) {
        var step = actionPlanService.addStep(id, dto);
        return new ActionPlanStepDTO(step.getId(), step.getDescription(), step.getResponsible(), step.getDeadline(),
                step.isDone());
    }

    @PutMapping("/{id}/steps/{stepId}/toggle")
    public ActionPlanDTO toggleStep(@PathVariable UUID id, @PathVariable UUID stepId) {
        return actionPlanService.toDTO(actionPlanService.toggleStep(id, stepId));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeStep(@PathVariable UUID id, @PathVariable UUID stepId) {
        actionPlanService.removeStep(id, stepId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable UUID id) {
        actionPlanService.deletePlan(id);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ActionPlanMessageDTO addMessage(@PathVariable UUID id, @RequestBody @Valid ActionPlanMessageRequestDTO dto) {
        var msg = actionPlanService.addMessage(id, dto);
        return new ActionPlanMessageDTO(
                msg.getId(),
                msg.getType(),
                msg.getText(),
                msg.getUserName(),
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(msg.getDate()));
    }
}
