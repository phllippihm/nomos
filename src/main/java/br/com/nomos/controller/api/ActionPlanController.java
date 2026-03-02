package br.com.nomos.controller.api;

import br.com.nomos.dto.action.ActionPlanCreateRequestDTO;
import br.com.nomos.dto.action.ActionPlanDTO;
import br.com.nomos.dto.action.ActionPlanMessageDTO;
import br.com.nomos.dto.action.ActionPlanMessageRequestDTO;
import br.com.nomos.dto.action.ActionPlanStepDTO;
import br.com.nomos.dto.action.ActionPlanStepRequestDTO;
import br.com.nomos.dto.action.ActionPlanUpdateRequestDTO;
import br.com.nomos.dto.action.AttachmentDTO;
import br.com.nomos.domain.action.MessageAttachment;
import br.com.nomos.repository.action.MessageAttachmentRepository;
import br.com.nomos.service.action.ActionPlanService;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/action-plans")
public class ActionPlanController {

    private final ActionPlanService actionPlanService;
    private final MessageAttachmentRepository messageAttachmentRepository;

    public ActionPlanController(ActionPlanService actionPlanService,
            MessageAttachmentRepository messageAttachmentRepository) {
        this.actionPlanService = actionPlanService;
        this.messageAttachmentRepository = messageAttachmentRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActionPlanDTO createActionPlan(@RequestBody @Valid ActionPlanCreateRequestDTO dto) {
        return actionPlanService.toDTO(actionPlanService.createPlan(dto));
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
        return new ActionPlanStepDTO(step.getId(), step.getDescription(), step.getResponsible(),
                step.getResponsibleUser() != null ? step.getResponsibleUser().getId() : null,
                step.getDeadline() != null ? step.getDeadline().toString() : null,
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
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(msg.getDate()),
                List.of());
    }

    @PostMapping(value = "/{id}/messages/with-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ActionPlanMessageDTO addMessageWithAttachments(
            @PathVariable UUID id,
            @RequestParam("text") String text,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        var msg = actionPlanService.addMessageWithAttachments(id, text, files);
        List<AttachmentDTO> attachmentDTOs = msg.getAttachments().stream()
                .map(a -> new AttachmentDTO(a.getId(), a.getFileName(), a.getContentType(), a.getFileSize()))
                .toList();
        return new ActionPlanMessageDTO(
                msg.getId(),
                msg.getType(),
                msg.getText(),
                msg.getUserName(),
                java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").format(msg.getDate()),
                attachmentDTOs);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable UUID attachmentId) {
        MessageAttachment attachment = messageAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        byte[] data = attachment.getFileData();
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }

        ByteArrayResource resource = new ByteArrayResource(data);

        String safeFileName = attachment.getFileName() != null ? attachment.getFileName() : "download";

        // Simplified header to avoid any browser compatibility issues
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName + "\"")
                .contentType(MediaType.parseMediaType(
                        attachment.getContentType() != null ? attachment.getContentType() : "application/octet-stream"))
                .contentLength(data.length)
                .body(resource);
    }
}
