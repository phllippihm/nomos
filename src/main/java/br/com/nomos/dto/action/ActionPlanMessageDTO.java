package br.com.nomos.dto.action;

import java.util.List;
import java.util.UUID;

public record ActionPlanMessageDTO(
        UUID id,
        String type,
        String text,
        String userName,
        String date,
        List<AttachmentDTO> attachments) {
}
