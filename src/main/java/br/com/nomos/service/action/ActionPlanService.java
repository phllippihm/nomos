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
import br.com.nomos.domain.action.MessageAttachment;
import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.domain.user.User;
import br.com.nomos.dto.action.ActionPlanCreateRequestDTO;
import br.com.nomos.dto.action.AttachmentDTO;
import br.com.nomos.repository.action.ActionPlanRepository;
import br.com.nomos.repository.action.MessageAttachmentRepository;
import br.com.nomos.repository.test.ExecutionRecordRepository;
import br.com.nomos.repository.user.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ActionPlanService {

    private final ActionPlanRepository actionPlanRepository;
    private final ExecutionRecordRepository executionRecordRepository;
    private final UserRepository userRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;

    public ActionPlanService(ActionPlanRepository actionPlanRepository,
            ExecutionRecordRepository executionRecordRepository,
            UserRepository userRepository,
            MessageAttachmentRepository messageAttachmentRepository) {
        this.actionPlanRepository = actionPlanRepository;
        this.executionRecordRepository = executionRecordRepository;
        this.userRepository = userRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
    }

    @Transactional
    public ActionPlan createPlan(ActionPlanCreateRequestDTO dto) {
        ActionPlan plan;
        if (dto.executionId() != null) {
            ExecutionRecord exec = executionRecordRepository.findById(dto.executionId())
                    .orElseThrow(() -> new IllegalArgumentException("Execução não encontrada"));
            plan = new ActionPlan(exec, dto.description(), "Manual");
            plan.setStatus("ACTIVE");
        } else {
            plan = new ActionPlan(dto.description(), "Manual");
        }

        plan.addMessage(new ActionPlanMessage(plan, "SYSTEM",
                "Plano de ação criado manualmente.", "Sistema"));

        if (dto.steps() != null) {
            for (var stepDto : dto.steps()) {
                LocalDate deadlineDate = (stepDto.deadline() != null && !stepDto.deadline().isBlank())
                        ? LocalDate.parse(stepDto.deadline())
                        : null;
                String responsibleName = stepDto.responsible();
                User responsibleUser = null;
                if (stepDto.responsibleId() != null) {
                    responsibleUser = userRepository.findById(stepDto.responsibleId()).orElse(null);
                    if (responsibleUser != null) {
                        responsibleName = responsibleUser.getNome();
                    }
                }
                ActionPlanStep step = new ActionPlanStep(plan, stepDto.description(), responsibleName, deadlineDate);
                step.setResponsibleUser(responsibleUser);
                plan.addStep(step);
            }
        }

        return actionPlanRepository.save(plan);
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
        LocalDate deadlineDate = (dto.deadline() != null && !dto.deadline().isBlank())
                ? LocalDate.parse(dto.deadline())
                : null;

        String responsibleName = dto.responsible();
        User responsibleUser = null;
        if (dto.responsibleId() != null) {
            responsibleUser = userRepository.findById(dto.responsibleId()).orElse(null);
            if (responsibleUser != null) {
                responsibleName = responsibleUser.getNome();
            }
        }

        ActionPlanStep step = new ActionPlanStep(plan, dto.description(), responsibleName, deadlineDate);
        step.setResponsibleUser(responsibleUser);
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

    @Transactional
    public ActionPlanMessage addMessageWithAttachments(UUID planId, String text, List<MultipartFile> files) {
        ActionPlan plan = getActionPlan(planId);
        ActionPlanMessage msg = new ActionPlanMessage(plan, "USER", text, "Master Root");
        plan.addMessage(msg);

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                try {
                    MessageAttachment attachment = new MessageAttachment(
                            msg,
                            file.getOriginalFilename(),
                            file.getContentType(),
                            file.getSize(),
                            file.getBytes());
                    msg.getAttachments().add(attachment);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao processar arquivo: " + file.getOriginalFilename(), e);
                }
            }
        }

        actionPlanRepository.saveAndFlush(plan);
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
                .map(s -> new ActionPlanStepDTO(s.getId(), s.getDescription(), s.getResponsible(),
                        s.getResponsibleUser() != null ? s.getResponsibleUser().getId() : null,
                        s.getDeadline() != null ? s.getDeadline().toString() : null,
                        s.isDone()))
                .toList();

        List<ActionPlanMessageDTO> messageDTOs = plan.getMessages().stream()
                .map(m -> {
                    List<AttachmentDTO> attachmentDTOs = m.getAttachments() != null
                            ? m.getAttachments().stream()
                                    .map(a -> new AttachmentDTO(a.getId(), a.getFileName(), a.getContentType(),
                                            a.getFileSize()))
                                    .toList()
                            : List.of();
                    return new ActionPlanMessageDTO(
                            m.getId(),
                            m.getType(),
                            m.getText(),
                            m.getUserName(),
                            java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(m.getDate()),
                            attachmentDTOs);
                })
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
