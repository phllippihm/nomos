package br.com.nomos.service.risk;

import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.risk.MatrixConfig;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.risk.MatrixConfigRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class MatrixConfigService {

    @Autowired
    private MatrixConfigRepository matrixConfigRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    private static final String DEFAULT_CONFIG = "{\"empresaId\":\"global\",\"riskDimensions\":[{\"id\":\"1\",\"name\":\"Impacto\"},{\"id\":\"2\",\"name\":\"Probabilidade\"}],\"riskRanges\":[{\"id\":\"1\",\"min\":1,\"max\":5,\"label\":\"Baixo\",\"color\":\"#10b981\"},{\"id\":\"2\",\"min\":6,\"max\":15,\"label\":\"Médio\",\"color\":\"#f59e0b\"},{\"id\":\"3\",\"min\":16,\"max\":25,\"label\":\"Alto\",\"color\":\"#ef4444\"}],\"complianceRanges\":[{\"id\":\"c1\",\"min\":0,\"max\":49,\"label\":\"Crítico\",\"color\":\"#ef4444\"},{\"id\":\"c2\",\"min\":50,\"max\":74,\"label\":\"Regular\",\"color\":\"#f59e0b\"},{\"id\":\"c3\",\"min\":75,\"max\":89,\"label\":\"Bom\",\"color\":\"#3b82f6\"},{\"id\":\"c4\",\"min\":90,\"max\":100,\"label\":\"Excelente\",\"color\":\"#10b981\"}],\"notificationThresholdId\":\"c3\",\"maintenanceMatrix\":{}}";

    public String getConfigForInstitution(UUID institutionId) {
        Optional<MatrixConfig> configOpt = matrixConfigRepository.findByInstitutionId(institutionId);

        if (configOpt.isPresent()) {
            return configOpt.get().getConfigJson();
        }

        return DEFAULT_CONFIG;
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
}
