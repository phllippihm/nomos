package br.com.nomos.dto.action;

import java.util.UUID;

public record AttachmentDTO(UUID id, String fileName, String contentType, Long fileSize) {
}
