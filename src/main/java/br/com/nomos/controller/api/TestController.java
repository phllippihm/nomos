package br.com.nomos.controller.api;

import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.dto.test.ExecutionRecordDTO;
import br.com.nomos.dto.test.ExecutionRecordRequestDTO;
import br.com.nomos.dto.test.PlanningItemDTO;
import br.com.nomos.dto.test.ScopeItemDTO;
import br.com.nomos.dto.test.ScopeItemRequestDTO;
import br.com.nomos.service.TestService;
import br.com.nomos.service.risk.MatrixConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

        private final TestService testService;
        private final MatrixConfigService matrixConfigService;

        @GetMapping("/scope")
        public List<ScopeItemDTO> listScope() {
                return testService.listScopeItems().stream()
                                .map(this::toScopeDTO)
                                .toList();
        }

        @PostMapping("/scope")
        @ResponseStatus(HttpStatus.CREATED)
        public ScopeItemDTO createScope(@RequestBody @Valid ScopeItemRequestDTO dto) {
                var s = testService.createScopeItem(dto);
                return toScopeDTO(s);
        }

        @PostMapping("/scope/{id}/generate-planning")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void generatePlanning(@PathVariable UUID id) {
                testService.generatePlanning(id);
        }

        @PutMapping("/scope/{id}")
        public ScopeItemDTO updateScope(@PathVariable UUID id, @RequestBody @Valid ScopeItemRequestDTO dto) {
                var s = testService.updateScopeItem(id, dto);
                return toScopeDTO(s);
        }

        @DeleteMapping("/scope/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteScope(@PathVariable UUID id) {
                testService.deleteScopeItem(id);
        }

        @GetMapping("/scope/{id}/executions")
        public List<ExecutionRecordDTO> listExecutions(@PathVariable UUID id) {
                return testService.listExecutionsByScope(id).stream()
                                .map(this::toExecutionDTO)
                                .toList();
        }

        @GetMapping("/planning")
        public List<PlanningItemDTO> listPlanning() {
                return testService.listPlanningItems();
        }

        @PostMapping("/execution")
        @ResponseStatus(HttpStatus.CREATED)
        public ExecutionRecordDTO createExecution(@RequestBody @Valid ExecutionRecordRequestDTO dto) {
                var e = testService.saveExecution(dto);
                return toExecutionDTO(e);
        }

        private ScopeItemDTO toScopeDTO(br.com.nomos.domain.test.ScopeItem s) {
                return new ScopeItemDTO(
                                s.getId(), s.getNome(), s.getFinalidade(), s.getTagArea(),
                                s.getPeriodicidade(), s.getMesInicio(), s.getBaseNormativa(), s.getProbabilidade(),
                                s.getImpacto(), s.getRiskScore(), s.getRiskLevel(), s.getArea().getId(),
                                s.getProcedimentos(),
                                s.getCostCenter() != null ? s.getCostCenter().getId() : null,
                                s.getCostCenter() != null ? s.getCostCenter().getNome() : null);
        }

        private ExecutionRecordDTO toExecutionDTO(ExecutionRecord e) {
                String conformityLevel = null;
                String conformityColor = null;
                String priorityAction = null;

                if (e.getConformityPercentage() != null && e.getScopeItem() != null
                                && e.getScopeItem().getArea() != null) {
                        UUID institutionId = e.getScopeItem().getArea().getDirectorate().getInstitution().getId();

                        var compliance = matrixConfigService.resolveComplianceLabel(
                                        institutionId, e.getConformityPercentage());
                        if (compliance != null) {
                                conformityLevel = compliance.label();
                                conformityColor = compliance.color();
                        }

                        if (e.getScopeItem().getRiskLevel() != null) {
                                priorityAction = matrixConfigService.resolveAction(
                                                institutionId, e.getConformityPercentage(),
                                                e.getScopeItem().getRiskLevel());
                        }
                }

                return new ExecutionRecordDTO(
                                e.getId(),
                                e.getScopeItem().getId(),
                                e.getTestDate(),
                                e.getResponsible(),
                                e.getSampleSize(),
                                e.getNonConforming(),
                                e.getConforming(),
                                e.getConformityPercentage(),
                                e.getScore(),
                                e.getNonConformities(),
                                e.getActionTaken(),
                                conformityLevel,
                                conformityColor,
                                priorityAction);
        }
}
