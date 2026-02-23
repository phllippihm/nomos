package br.com.nomos.controller.api;

import br.com.nomos.dto.organization.AreaDTO;
import br.com.nomos.dto.organization.DirectorateDTO;
import br.com.nomos.dto.organization.InstitutionDTO;
import br.com.nomos.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organization")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/institutions")
    public List<InstitutionDTO> listInstitutions() {
        return organizationService.listInstitutions().stream()
                .map(i -> new InstitutionDTO(i.getId(), i.getNome(), i.isAtivo()))
                .toList();
    }

    @PostMapping("/institutions")
    public InstitutionDTO createInstitution(@RequestBody InstitutionDTO dto) {
        var institution = organizationService.createInstitution(dto.nome());
        return new InstitutionDTO(institution.getId(), institution.getNome(), institution.isAtivo());
    }

    @GetMapping("/institutions/{id}/directorates")
    public List<DirectorateDTO> listDirectorates(@PathVariable UUID id) {
        return organizationService.listDirectoratesByInstitution(id).stream()
                .map(d -> new DirectorateDTO(d.getId(), d.getNome(), d.getInstitution().getId()))
                .toList();
    }

    @PostMapping("/directorates")
    public DirectorateDTO createDirectorate(@RequestBody DirectorateDTO dto) {
        var directorate = organizationService.createDirectorate(dto.nome(), dto.institutionId());
        return new DirectorateDTO(directorate.getId(), directorate.getNome(), directorate.getInstitution().getId());
    }

    @GetMapping("/directorates/{id}/areas")
    public List<AreaDTO> listAreas(@PathVariable UUID id) {
        return organizationService.listAreasByDirectorate(id).stream()
                .map(a -> new AreaDTO(a.getId(), a.getNome(), a.getDirectorate().getId()))
                .toList();
    }

    @PostMapping("/areas")
    public AreaDTO createArea(@RequestBody AreaDTO dto) {
        var area = organizationService.createArea(dto.nome(), dto.directorateId());
        return new AreaDTO(area.getId(), area.getNome(), area.getDirectorate().getId());
    }
}
