package br.com.nomos.service;

import br.com.nomos.domain.organization.Area;
import br.com.nomos.domain.organization.CostCenter;
import br.com.nomos.domain.organization.Directorate;
import br.com.nomos.domain.organization.Institution;
import br.com.nomos.repository.organization.AreaRepository;
import br.com.nomos.repository.organization.CostCenterRepository;
import br.com.nomos.repository.organization.DirectorateRepository;
import br.com.nomos.repository.organization.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final InstitutionRepository institutionRepository;
    private final DirectorateRepository directorateRepository;
    private final AreaRepository areaRepository;
    private final CostCenterRepository costCenterRepository;

    @Transactional(readOnly = true)
    public List<Institution> listInstitutions() {
        return institutionRepository.findAll();
    }

    @Transactional
    public Institution createInstitution(String nome, String cnpj) {
        return institutionRepository.save(new Institution(nome, cnpj));
    }

    @Transactional
    public Institution updateInstitution(UUID id, String nome, String cnpj) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instituição não encontrada"));
        inst.setNome(nome);
        inst.setCnpj(cnpj);
        return institutionRepository.save(inst);
    }

    @Transactional
    public void deleteInstitution(UUID id) {
        institutionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Directorate> listDirectoratesByInstitution(UUID institutionId) {
        return directorateRepository.findAll().stream()
                .filter(d -> d.getInstitution().getId().equals(institutionId))
                .toList();
    }

    @Transactional
    public Directorate createDirectorate(String nome, UUID institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Instituição não encontrada"));
        return directorateRepository.save(new Directorate(nome, institution));
    }

    @Transactional(readOnly = true)
    public List<Area> listAreasByDirectorate(UUID directorateId) {
        return areaRepository.findAll().stream()
                .filter(a -> a.getDirectorate().getId().equals(directorateId))
                .toList();
    }

    @Transactional
    public Area createArea(String nome, UUID directorateId) {
        Directorate directorate = directorateRepository.findById(directorateId)
                .orElseThrow(() -> new RuntimeException("Diretoria não encontrada"));
        return areaRepository.save(new Area(nome, directorate));
    }

    @Transactional
    public void deleteArea(UUID id) {
        areaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<CostCenter> listCostCentersByInstitution(UUID institutionId) {
        return costCenterRepository.findByInstitutionId(institutionId);
    }

    @Transactional
    public CostCenter createCostCenter(String nome, String codigo, UUID institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Instituição não encontrada"));
        return costCenterRepository.save(new CostCenter(nome, codigo, institution));
    }

    @Transactional
    public void deleteCostCenter(UUID id) {
        costCenterRepository.deleteById(id);
    }
}
