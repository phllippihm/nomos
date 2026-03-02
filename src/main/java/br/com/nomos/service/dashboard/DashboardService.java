package br.com.nomos.service.dashboard;

import br.com.nomos.domain.action.ActionPlan;
import br.com.nomos.domain.risk.RiskLevel;
import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.dto.dashboard.*;
import br.com.nomos.dto.dashboard.HomeSummaryDTO;
import br.com.nomos.domain.test.PlanningItem;
import br.com.nomos.repository.action.ActionPlanRepository;
import br.com.nomos.repository.test.ExecutionRecordRepository;
import br.com.nomos.repository.test.PlanningItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final ExecutionRecordRepository executionRecordRepository;
        private final ActionPlanRepository actionPlanRepository;
        private final PlanningItemRepository planningItemRepository;

        @Transactional(readOnly = true)
        public ComplianceDashboardDTO getComplianceStats(UUID institutionId, UUID directorateId, UUID areaId) {
                List<ExecutionRecord> records = executionRecordRepository.findAll().stream()
                                .filter(e -> e.getScopeItem().getArea().getDirectorate().getInstitution().getId()
                                                .equals(institutionId))
                                .filter(e -> directorateId == null || e.getScopeItem().getArea().getDirectorate()
                                                .getId().equals(directorateId))
                                .filter(e -> areaId == null || e.getScopeItem().getArea().getId().equals(areaId))
                                .toList();

                if (records.isEmpty()) {
                        return new ComplianceDashboardDTO(BigDecimal.ZERO, 0L, List.of(), List.of(), List.of(),
                                        List.of());
                }

                BigDecimal avg = records.stream()
                                .map(ExecutionRecord::getConformityPercentage)
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(BigDecimal.valueOf(records.size()), 2, RoundingMode.HALF_UP);

                // Monthly Stats
                Map<String, List<ExecutionRecord>> ByMonth = records.stream()
                                .collect(Collectors.groupingBy(e -> e.getTestDate().getMonth()
                                                .getDisplayName(TextStyle.FULL, new Locale("pt", "BR")) + "/"
                                                + e.getTestDate().getYear()));

                List<MonthlyStatsDTO> monthlyStats = ByMonth.entrySet().stream()
                                .map(entry -> {
                                        String[] parts = entry.getKey().split("/");
                                        BigDecimal mAvg = entry.getValue().stream()
                                                        .map(ExecutionRecord::getConformityPercentage)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .divide(BigDecimal.valueOf(entry.getValue().size()), 2,
                                                                        RoundingMode.HALF_UP);
                                        return new MonthlyStatsDTO(parts[0], Integer.parseInt(parts[1]), mAvg,
                                                        (long) entry.getValue().size());
                                })
                                .sorted(Comparator.comparing(MonthlyStatsDTO::year)
                                                .thenComparing(MonthlyStatsDTO::month))
                                .toList();

                // Area Stats
                List<EntityStatsDTO> areaStats = records.stream()
                                .collect(Collectors.groupingBy(e -> e.getScopeItem().getArea().getNome()))
                                .entrySet().stream()
                                .map(entry -> {
                                        BigDecimal aAvg = entry.getValue().stream()
                                                        .map(ExecutionRecord::getConformityPercentage)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .divide(BigDecimal.valueOf(entry.getValue().size()), 2,
                                                                        RoundingMode.HALF_UP);
                                        return new EntityStatsDTO(entry.getKey(), aAvg, (long) entry.getValue().size());
                                })
                                .toList();

                // Directorate Stats
                List<EntityStatsDTO> directorateStats = records.stream()
                                .collect(Collectors
                                                .groupingBy(e -> e.getScopeItem().getArea().getDirectorate().getNome()))
                                .entrySet().stream()
                                .map(entry -> {
                                        BigDecimal dAvg = entry.getValue().stream()
                                                        .map(ExecutionRecord::getConformityPercentage)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .divide(BigDecimal.valueOf(entry.getValue().size()), 2,
                                                                        RoundingMode.HALF_UP);
                                        return new EntityStatsDTO(entry.getKey(), dAvg, (long) entry.getValue().size());
                                })
                                .toList();

                // Risk Matrix
                List<RiskMatrixCellDTO> riskMatrix = records.stream()
                                .collect(Collectors.groupingBy(e -> e.getScopeItem().getProbabilidade() + "-"
                                                + e.getScopeItem().getImpacto()))
                                .entrySet().stream()
                                .map(entry -> {
                                        String[] parts = entry.getKey().split("-");
                                        int prob = Integer.parseInt(parts[0]);
                                        int imp = Integer.parseInt(parts[1]);
                                        RiskLevel level = RiskLevel.fromScore(prob * imp);
                                        return new RiskMatrixCellDTO(prob, imp, (long) entry.getValue().size(),
                                                        level.name());
                                })
                                .toList();

                return new ComplianceDashboardDTO(avg, (long) records.size(), monthlyStats, areaStats, directorateStats,
                                riskMatrix);
        }

        @Transactional(readOnly = true)
        public ActionPlansOverviewDTO getActionPlansStats(UUID institutionId, UUID directorateId, UUID areaId) {
                List<ActionPlan> plans = actionPlanRepository.findAll().stream()
                                .filter(p -> p.getExecutionRecord().getScopeItem().getArea().getDirectorate()
                                                .getInstitution().getId().equals(institutionId))
                                .filter(p -> directorateId == null || p.getExecutionRecord().getScopeItem().getArea()
                                                .getDirectorate().getId().equals(directorateId))
                                .filter(p -> areaId == null || p.getExecutionRecord().getScopeItem().getArea().getId()
                                                .equals(areaId))
                                .toList();

                if (plans.isEmpty()) {
                        return new ActionPlansOverviewDTO(0L, BigDecimal.ZERO, 0L, List.of(), List.of(), List.of());
                }

                long total = plans.size();
                long completed = plans.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count();
                long active = total - completed;

                BigDecimal completionRate = BigDecimal.valueOf(completed)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);

                // Monthly Stats
                Map<String, List<ActionPlan>> byMonth = plans.stream()
                                .collect(Collectors.groupingBy(p -> p.getCreatedAt().getMonth()
                                                .getDisplayName(TextStyle.FULL, new Locale("pt", "BR")) + "/"
                                                + p.getCreatedAt().getYear()));

                List<MonthlyStatsDTO> monthlyStats = byMonth.entrySet().stream()
                                .map(entry -> {
                                        String[] parts = entry.getKey().split("/");
                                        long mTotal = entry.getValue().size();
                                        long mCompleted = entry.getValue().stream()
                                                        .filter(p -> "COMPLETED".equals(p.getStatus())).count();
                                        BigDecimal mRate = mTotal > 0 ? BigDecimal.valueOf(mCompleted)
                                                        .multiply(BigDecimal.valueOf(100))
                                                        .divide(BigDecimal.valueOf(mTotal), 2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;
                                        return new MonthlyStatsDTO(parts[0], Integer.parseInt(parts[1]), mRate, mTotal);
                                })
                                .toList();

                // Area Stats
                List<EntityStatsDTO> areaStats = plans.stream()
                                .collect(Collectors.groupingBy(
                                                p -> p.getExecutionRecord().getScopeItem().getArea().getNome()))
                                .entrySet().stream()
                                .map(entry -> {
                                        long aTotal = entry.getValue().size();
                                        long aCompleted = entry.getValue().stream()
                                                        .filter(p -> "COMPLETED".equals(p.getStatus())).count();
                                        BigDecimal aRate = aTotal > 0 ? BigDecimal.valueOf(aCompleted)
                                                        .multiply(BigDecimal.valueOf(100))
                                                        .divide(BigDecimal.valueOf(aTotal), 2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;
                                        return new EntityStatsDTO(entry.getKey(), aRate, aTotal);
                                })
                                .toList();

                // Directorate Stats
                List<EntityStatsDTO> directorateStats = plans.stream()
                                .collect(Collectors.groupingBy(
                                                p -> p.getExecutionRecord().getScopeItem().getArea().getDirectorate()
                                                                .getNome()))
                                .entrySet().stream()
                                .map(entry -> {
                                        long dTotal = entry.getValue().size();
                                        long dCompleted = entry.getValue().stream()
                                                        .filter(p -> "COMPLETED".equals(p.getStatus())).count();
                                        BigDecimal dRate = dTotal > 0 ? BigDecimal.valueOf(dCompleted)
                                                        .multiply(BigDecimal.valueOf(100))
                                                        .divide(BigDecimal.valueOf(dTotal), 2, RoundingMode.HALF_UP)
                                                        : BigDecimal.ZERO;
                                        return new EntityStatsDTO(entry.getKey(), dRate, dTotal);
                                })
                                .toList();

                return new ActionPlansOverviewDTO(total, completionRate, active, monthlyStats, areaStats,
                                directorateStats);
        }

        @Transactional(readOnly = true)
        public HomeSummaryDTO getHomeSummary(UUID institutionId) {
                List<PlanningItem> allItems = planningItemRepository.findAll().stream()
                                .filter(p -> p.getScopeItem() != null
                                                && p.getScopeItem().getArea() != null
                                                && p.getScopeItem().getArea().getDirectorate() != null
                                                && p.getScopeItem().getArea().getDirectorate().getInstitution() != null
                                                && p.getScopeItem().getArea().getDirectorate().getInstitution().getId()
                                                                .equals(institutionId))
                                .toList();

                long totalPlanejados = allItems.size();
                long totalRealizados = allItems.stream().filter(p -> "Realizado".equals(p.getStatus())).count();
                long totalPendentes = allItems.stream().filter(p -> "Planejado".equals(p.getStatus())).count();

                List<ExecutionRecord> executions = executionRecordRepository.findAll().stream()
                                .filter(e -> e.getScopeItem() != null
                                                && e.getScopeItem().getArea() != null
                                                && e.getScopeItem().getArea().getDirectorate() != null
                                                && e.getScopeItem().getArea().getDirectorate().getInstitution() != null
                                                && e.getScopeItem().getArea().getDirectorate().getInstitution().getId()
                                                                .equals(institutionId))
                                .toList();

                BigDecimal avgConformidade = BigDecimal.ZERO;
                List<BigDecimal> percentages = executions.stream()
                                .map(ExecutionRecord::getConformityPercentage)
                                .filter(Objects::nonNull)
                                .toList();
                if (!percentages.isEmpty()) {
                        avgConformidade = percentages.stream()
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                        .divide(BigDecimal.valueOf(percentages.size()), 2, RoundingMode.HALF_UP);
                }

                List<ActionPlan> plans = actionPlanRepository.findAll().stream()
                                .filter(p -> p.getExecutionRecord() != null
                                                && p.getExecutionRecord().getScopeItem() != null
                                                && p.getExecutionRecord().getScopeItem().getArea() != null
                                                && p.getExecutionRecord().getScopeItem().getArea()
                                                                .getDirectorate() != null
                                                && p.getExecutionRecord().getScopeItem().getArea().getDirectorate()
                                                                .getInstitution() != null
                                                && p.getExecutionRecord().getScopeItem().getArea().getDirectorate()
                                                                .getInstitution().getId().equals(institutionId))
                                .toList();

                long draft = plans.stream().filter(p -> "DRAFT".equals(p.getStatus())).count();
                long active = plans.stream().filter(p -> "ACTIVE".equals(p.getStatus())).count();
                long completed = plans.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count();

                List<HomeSummaryDTO.PendingTestDTO> pending = allItems.stream()
                                .filter(p -> "Planejado".equals(p.getStatus()))
                                .sorted(Comparator.comparingInt(p -> {
                                        if (p.getScopeItem() == null || p.getScopeItem().getRiskLevel() == null)
                                                return 2;
                                        return switch (p.getScopeItem().getRiskLevel()) {
                                                case ALTO -> 0;
                                                case MEDIO -> 1;
                                                case BAIXO -> 2;
                                        };
                                }))
                                .limit(20)
                                .map(p -> new HomeSummaryDTO.PendingTestDTO(
                                                p.getId(),
                                                p.getScopeItem().getId(),
                                                p.getScopeItem().getNome(),
                                                p.getScopeItem().getArea().getNome(),
                                                p.getScopeItem().getArea().getDirectorate().getNome(),
                                                p.getMes(),
                                                p.getAno(),
                                                p.getScopeItem().getRiskLevel() != null
                                                                ? p.getScopeItem().getRiskLevel().name()
                                                                : "N/A"))
                                .toList();

                return new HomeSummaryDTO(totalPlanejados, totalRealizados, totalPendentes, avgConformidade,
                                draft, active, completed, pending);
        }
}
