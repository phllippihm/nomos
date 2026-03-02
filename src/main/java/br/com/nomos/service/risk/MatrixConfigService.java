package br.com.nomos.service.risk;

import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.risk.MatrixConfig;
import br.com.nomos.domain.risk.RiskLevel;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.risk.MatrixConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class MatrixConfigService {

    private static final Logger log = LoggerFactory.getLogger(MatrixConfigService.class);

    @Autowired
    private MatrixConfigRepository matrixConfigRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String DEFAULT_CONFIG = "{\"empresaId\":\"global\",\"riskDimensions\":[{\"id\":\"1\",\"name\":\"Impacto\"},{\"id\":\"2\",\"name\":\"Probabilidade\"}],\"riskRanges\":[{\"id\":\"1\",\"min\":1,\"max\":5,\"label\":\"Baixo\",\"color\":\"#10b981\"},{\"id\":\"2\",\"min\":6,\"max\":15,\"label\":\"Médio\",\"color\":\"#f59e0b\"},{\"id\":\"3\",\"min\":16,\"max\":25,\"label\":\"Alto\",\"color\":\"#ef4444\"}],\"complianceRanges\":[{\"id\":\"c1\",\"min\":0,\"max\":49,\"label\":\"Crítico\",\"color\":\"#ef4444\"},{\"id\":\"c2\",\"min\":50,\"max\":74,\"label\":\"Regular\",\"color\":\"#f59e0b\"},{\"id\":\"c3\",\"min\":75,\"max\":89,\"label\":\"Bom\",\"color\":\"#3b82f6\"},{\"id\":\"c4\",\"min\":90,\"max\":100,\"label\":\"Excelente\",\"color\":\"#10b981\"}],\"notificationThresholdId\":\"c3\",\"maintenanceMatrix\":{}}";

    public String getConfigForInstitution(UUID institutionId) {
        Optional<MatrixConfig> configOpt = matrixConfigRepository.findByInstitutionId(institutionId);

        if (configOpt.isPresent()) {
            return configOpt.get().getConfigJson();
        }

        return DEFAULT_CONFIG;
    }

    /**
     * Resolves the compliance label and color for a given conformity percentage
     * based on the institution's MatrixConfig complianceRanges.
     *
     * @return a ComplianceResult with label and color, or null if no range matches
     */
    public ComplianceResult resolveComplianceLabel(UUID institutionId, BigDecimal percentage) {
        if (percentage == null) return null;
        try {
            String configJson = getConfigForInstitution(institutionId);
            JsonNode root = objectMapper.readTree(configJson);
            JsonNode ranges = root.get("complianceRanges");
            if (ranges == null || !ranges.isArray()) return null;

            double pct = percentage.doubleValue();
            for (JsonNode range : ranges) {
                double min = range.get("min").asDouble();
                double max = range.get("max").asDouble();
                if (pct >= min && pct <= max) {
                    return new ComplianceResult(
                            range.get("label").asText(),
                            range.get("color").asText());
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao resolver nível de conformidade para instituição {}: {}", institutionId, e.getMessage());
        }
        return null;
    }

    /**
     * Resolves the maintenance action by crossing riskLevel and conformity percentage
     * against the institution's maintenanceMatrix.
     * The matrix key format is "{riskLabel}-{complianceLabel}" (e.g. "Alto-Crítico").
     *
     * @return the action string from the matrix, or null if not configured
     */
    public String resolveAction(UUID institutionId, BigDecimal percentage, RiskLevel riskLevel) {
        if (percentage == null || riskLevel == null) return null;
        try {
            ComplianceResult compliance = resolveComplianceLabel(institutionId, percentage);
            if (compliance == null) return null;

            String configJson = getConfigForInstitution(institutionId);
            JsonNode root = objectMapper.readTree(configJson);
            JsonNode matrix = root.get("maintenanceMatrix");
            if (matrix == null || matrix.isEmpty()) return null;

            // Map RiskLevel enum to the label used in the matrix config
            String riskLabel = switch (riskLevel) {
                case BAIXO -> "Baixo";
                case MEDIO -> "Médio";
                case ALTO -> "Alto";
            };

            String key = riskLabel + "-" + compliance.label();
            JsonNode actionNode = matrix.get(key);
            if (actionNode != null && !actionNode.isNull()) {
                return actionNode.asText();
            }
        } catch (Exception e) {
            log.warn("Erro ao resolver ação da matriz para instituição {}: {}", institutionId, e.getMessage());
        }
        return null;
    }

    @Transactional
    public void saveConfigForInstitution(UUID institutionId, String configJson) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found"));

        MatrixConfig config = matrixConfigRepository.findByInstitutionId(institutionId)
                .orElse(new MatrixConfig());

        config.setInstitution(institution);
        config.setConfigJson(configJson);

        matrixConfigRepository.save(config);
    }

    public record ComplianceResult(String label, String color) {}
}
