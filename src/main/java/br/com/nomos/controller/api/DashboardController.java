package br.com.nomos.controller.api;

import br.com.nomos.dto.dashboard.ActionPlansOverviewDTO;
import br.com.nomos.dto.dashboard.ComplianceDashboardDTO;
import br.com.nomos.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/compliance")
    public ComplianceDashboardDTO getComplianceStats(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID directorateId,
            @RequestParam(required = false) UUID areaId) {
        return dashboardService.getComplianceStats(institutionId, directorateId, areaId);
    }

    @GetMapping("/action-plans")
    public ActionPlansOverviewDTO getActionPlansStats(
            @RequestParam UUID institutionId,
            @RequestParam(required = false) UUID directorateId,
            @RequestParam(required = false) UUID areaId) {
        return dashboardService.getActionPlansStats(institutionId, directorateId, areaId);
    }
}
