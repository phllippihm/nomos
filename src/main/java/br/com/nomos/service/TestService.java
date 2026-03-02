package br.com.nomos.service;

import br.com.nomos.domain.action.ActionPlan;
import br.com.nomos.domain.action.ActionPlanMessage;
import br.com.nomos.domain.risk.RiskLevel;
import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.domain.test.PlanningItem;
import br.com.nomos.domain.test.ScopeItem;
import br.com.nomos.dto.test.PlanningItemDTO;
import br.com.nomos.dto.test.ScopeItemRequestDTO;
import br.com.nomos.repository.action.ActionPlanRepository;
import br.com.nomos.repository.organization.AreaRepository;
import br.com.nomos.repository.organization.CostCenterRepository;
import br.com.nomos.repository.test.ExecutionRecordRepository;
import br.com.nomos.repository.test.ScopeItemRepository;
import br.com.nomos.service.risk.MatrixConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nomos.dto.test.ExecutionRecordRequestDTO;
import br.com.nomos.repository.test.PlanningItemRepository;

import java.time.LocalDate;
import java.util.ArrayList;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TestService {

    private final ScopeItemRepository scopeItemRepository;
    private final ExecutionRecordRepository executionRecordRepository;
    private final PlanningItemRepository planningItemRepository;
    private final AreaRepository areaRepository;
    private final CostCenterRepository costCenterRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final MatrixConfigService matrixConfigService;

    private static final List<String> MESES = List.of(
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro");

    @Transactional(readOnly = true)
    public List<ScopeItem> listScopeItems() {
        return scopeItemRepository.findAll();
    }

    @Transactional
    public ScopeItem createScopeItem(ScopeItemRequestDTO dto) {
        var area = areaRepository.findById(dto.areaId())
                .orElseThrow(() -> new IllegalArgumentException("Área não encontrada com ID: " + dto.areaId()));

        ScopeItem scopeItem = new ScopeItem(
                dto.nome(),
                dto.finalidade(),
                area,
                dto.periodicidade(),
                dto.mesInicio(),
                dto.baseNormativa(),
                dto.probabilidade(),
                dto.impacto());
        scopeItem.setTagArea(dto.tagArea());
        scopeItem.setProcedimentos(dto.procedimentos());
        if (dto.costCenterId() != null) {
            scopeItem.setCostCenter(costCenterRepository.findById(dto.costCenterId()).orElse(null));
        }

        return scopeItemRepository.save(scopeItem);
    }

    @Transactional
    public void generatePlanning(UUID scopeItemId) {
        ScopeItem scope = scopeItemRepository.findById(scopeItemId)
                .orElseThrow(() -> new IllegalArgumentException("ScopeItem não encontrado"));

        // Limpar agenda existente
        planningItemRepository.deleteByScopeItemId(scopeItemId);

        String period = scope.getPeriodicidade();
        String mesInicioStr = scope.getMesInicio();
        int mesInicioIdx = MESES.indexOf(mesInicioStr);

        if (mesInicioIdx == -1)
            mesInicioIdx = 0; // Default para Janeiro

        List<PlanningItem> items = new ArrayList<>();
        int step = switch (period != null ? period.toLowerCase() : "") {
            case "mensal" -> 1;
            case "bimestral" -> 2;
            case "trimestral" -> 3;
            case "semestral" -> 6;
            case "anual" -> 12;
            default -> 0;
        };

        if (step > 0) {
            int currentYear = LocalDate.now().getYear();
            for (int i = mesInicioIdx; i < 12; i += step) {
                items.add(new PlanningItem(scope, MESES.get(i), currentYear, "Planejado"));
            }
        }

        planningItemRepository.saveAll(items);
    }

    @Transactional
    public ScopeItem updateScopeItem(UUID id, ScopeItemRequestDTO dto) {
        ScopeItem scopeItem = scopeItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ScopeItem não encontrado"));

        var area = areaRepository.findById(dto.areaId())
                .orElseThrow(() -> new IllegalArgumentException("Área não encontrada"));

        scopeItem.setNome(dto.nome());
        scopeItem.setFinalidade(dto.finalidade());
        scopeItem.setTagArea(dto.tagArea());
        scopeItem.setArea(area);
        scopeItem.setPeriodicidade(dto.periodicidade());
        scopeItem.setMesInicio(dto.mesInicio());
        scopeItem.setBaseNormativa(dto.baseNormativa());
        scopeItem.setProcedimentos(dto.procedimentos());
        scopeItem.setProbabilidade(dto.probabilidade() != null ? dto.probabilidade() : 1);
        scopeItem.setImpacto(dto.impacto() != null ? dto.impacto() : 1);
        if (dto.costCenterId() != null) {
            scopeItem.setCostCenter(costCenterRepository.findById(dto.costCenterId()).orElse(null));
        } else {
            scopeItem.setCostCenter(null);
        }

        scopeItem.updateRisk();

        return scopeItemRepository.save(scopeItem);
    }

    @Transactional
    public void deleteScopeItem(UUID id) {
        // Delete action plans linked to execution records of this scope item first
        List<UUID> executionIds = executionRecordRepository.findByScopeItemId(id)
                .stream().map(ExecutionRecord::getId).toList();
        if (!executionIds.isEmpty()) {
            List<ActionPlan> linkedPlans = actionPlanRepository.findByExecutionRecord_IdIn(executionIds);
            actionPlanRepository.deleteAll(linkedPlans);
        }
        planningItemRepository.deleteByScopeItemId(id);
        executionRecordRepository.deleteByScopeItemId(id);
        scopeItemRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ExecutionRecord> listExecutionsByScope(UUID scopeItemId) {
        return executionRecordRepository.findAll().stream()
                .filter(e -> e.getScopeItem().getId().equals(scopeItemId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExecutionRecord> listAllExecutions() {
        return executionRecordRepository.findAll();
    }

    @Transactional
    public ExecutionRecord saveExecution(ExecutionRecordRequestDTO dto) {
        var scope = scopeItemRepository.findById(dto.scopeItemId())
                .orElseThrow(() -> new IllegalArgumentException("ScopeItem não encontrado"));
        var planning = planningItemRepository.findById(dto.planningItemId())
                .orElseThrow(() -> new IllegalArgumentException("PlanningItem não encontrado"));

        if (dto.nonConforming() > dto.sampleSize()) {
            throw new IllegalArgumentException(
                    "A quantidade de não-conformes não pode ser maior que o tamanho da amostra");
        }

        ExecutionRecord record = new ExecutionRecord();
        record.setScopeItem(scope);
        record.setPlanningItem(planning);
        record.setTestDate(java.time.LocalDateTime.now());
        record.setResponsible("Master Root"); // Placeholder - in production use SecurityContext
        record.setSampleSize(dto.sampleSize());
        record.setNonConforming(dto.nonConforming());
        record.setConforming(dto.sampleSize() - dto.nonConforming());
        record.setNonConformities(dto.nonConformities());

        if (dto.sampleSize() > 0) {
            double pc = ((dto.sampleSize() - dto.nonConforming()) / dto.sampleSize()) * 100.0;
            record.setConformityPercentage(
                    java.math.BigDecimal.valueOf(pc).setScale(2, java.math.RoundingMode.HALF_UP));
        }

        // Resolve action from MatrixConfig (backend is source of truth)
        String resolvedAction = null;
        UUID institutionId = scope.getArea().getDirectorate().getInstitution().getId();
        if (record.getConformityPercentage() != null && scope.getRiskLevel() != null) {
            resolvedAction = matrixConfigService.resolveAction(
                    institutionId, record.getConformityPercentage(), scope.getRiskLevel());
        }
        // Use resolved action, fall back to frontend-provided value
        record.setActionTaken(resolvedAction != null ? resolvedAction : dto.actionTaken());

        // Update Planning Status
        planning.setStatus("Realizado");
        planningItemRepository.save(planning);

        ExecutionRecord savedRecord = executionRecordRepository.save(record);

        // Action Plan Automation Trigger - only for actions that indicate remediation is needed
        String effectiveAction = savedRecord.getActionTaken();
        boolean requiresActionPlan = effectiveAction != null && !effectiveAction.isBlank()
                && !effectiveAction.equalsIgnoreCase("Manutenção")
                && !effectiveAction.equalsIgnoreCase("Nenhuma")
                && !effectiveAction.equalsIgnoreCase("Sem Acompanhamento");

        if (requiresActionPlan) {
            boolean planAlreadyExists = actionPlanRepository.findAll().stream()
                    .anyMatch(p -> p.getExecutionRecord() != null
                            && p.getExecutionRecord().getId().equals(savedRecord.getId())
                            && !p.getStatus().equals("COMPLETED"));

            if (!planAlreadyExists) {
                ActionPlan draftPlan = new ActionPlan(savedRecord, "", "Sistema");
                draftPlan.addMessage(new ActionPlanMessage(draftPlan, "SYSTEM",
                        "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado. Ação: "
                                + effectiveAction,
                        "Sistema"));
                actionPlanRepository.save(draftPlan);
            }
        }

        return savedRecord;
    }

    public RiskLevel calculateRiskLevel(int probability, int impact) {
        int score = probability * impact;
        return RiskLevel.fromScore(score);
    }

    @Transactional(readOnly = true)
    public List<PlanningItemDTO> listPlanningItems() {
        return planningItemRepository.findAll().stream()
                .map(p -> {
                    var execution = executionRecordRepository.findByPlanningItemId(p.getId()).orElse(null);
                    Double compliance = execution != null && execution.getConformityPercentage() != null
                            ? execution.getConformityPercentage().doubleValue()
                            : null;

                    String conformityLevel = null;
                    String conformityColor = null;
                    if (compliance != null && p.getScopeItem().getArea() != null
                            && p.getScopeItem().getArea().getDirectorate() != null
                            && p.getScopeItem().getArea().getDirectorate().getInstitution() != null) {
                        UUID instId = p.getScopeItem().getArea().getDirectorate().getInstitution().getId();
                        var result = matrixConfigService.resolveComplianceLabel(
                                instId, java.math.BigDecimal.valueOf(compliance));
                        if (result != null) {
                            conformityLevel = result.label();
                            conformityColor = result.color();
                        }
                    }

                    return new PlanningItemDTO(
                            p.getId(),
                            p.getScopeItem().getId(),
                            p.getScopeItem().getNome(),
                            p.getScopeItem().getArea().getNome(),
                            p.getScopeItem().getArea().getDirectorate().getNome(),
                            p.getScopeItem().getRiskLevel() != null ? p.getScopeItem().getRiskLevel().name() : "N/A",
                            p.getMes(),
                            p.getAno(),
                            p.getStatus(),
                            "Responsável TI", // Placeholder
                            compliance,
                            conformityLevel,
                            conformityColor);
                })
                .toList();
    }
}
