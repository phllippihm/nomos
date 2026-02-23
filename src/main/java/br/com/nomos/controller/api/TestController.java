package br.com.nomos.controller.api;

import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.dto.test.ExecutionRecordDTO;
import br.com.nomos.dto.test.ExecutionRecordRequestDTO;
import br.com.nomos.dto.test.PlanningItemDTO;
import br.com.nomos.dto.test.ScopeItemDTO;
import br.com.nomos.dto.test.ScopeItemRequestDTO;
import br.com.nomos.service.TestService;
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

        @GetMapping("/scope")
        public List<ScopeItemDTO> listScope() {
                return testService.listScopeItems().stream()
                                .map(s -> new ScopeItemDTO(
                                                s.getId(), s.getNome(), s.getFinalidade(), s.getTagArea(),
                                                s.getPeriodicidade(), s.getMesInicio(), s.getBaseNormativa(),
                                                s.getProbabilidade(),
                                                s.getImpacto(), s.getRiskScore(), s.getRiskLevel(),
                                                s.getArea().getId()))
                                .toList();
        }

        @PostMapping("/scope")
        @ResponseStatus(HttpStatus.CREATED)
        public ScopeItemDTO createScope(@RequestBody @Valid ScopeItemRequestDTO dto) {
                var s = testService.createScopeItem(dto);
                return new ScopeItemDTO(
                                s.getId(), s.getNome(), s.getFinalidade(), s.getTagArea(),
                                s.getPeriodicidade(), s.getMesInicio(), s.getBaseNormativa(), s.getProbabilidade(),
                                s.getImpacto(), s.getRiskScore(), s.getRiskLevel(), s.getArea().getId());
        }

        @PostMapping("/scope/{id}/generate-planning")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void generatePlanning(@PathVariable UUID id) {
                testService.generatePlanning(id);
        }

        @PutMapping("/scope/{id}")
        public ScopeItemDTO updateScope(@PathVariable UUID id, @RequestBody @Valid ScopeItemRequestDTO dto) {
                var s = testService.updateScopeItem(id, dto);
                return new ScopeItemDTO(
                                s.getId(), s.getNome(), s.getFinalidade(), s.getTagArea(),
                                s.getPeriodicidade(), s.getMesInicio(), s.getBaseNormativa(), s.getProbabilidade(),
                                s.getImpacto(), s.getRiskScore(), s.getRiskLevel(), s.getArea().getId());
        }

        @DeleteMapping("/scope/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteScope(@PathVariable UUID id) {
                testService.deleteScopeItem(id);
        }

        @GetMapping("/scope/{id}/executions")
        public List<ExecutionRecordDTO> listExecutions(@PathVariable UUID id) {
                return testService.listExecutionsByScope(id).stream()
                                .map(e -> new ExecutionRecordDTO(
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
                                                e.getActionTaken()))
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
                                e.getActionTaken());
        }
}
