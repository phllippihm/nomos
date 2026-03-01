package br.com.nomos.controller.risk;

import br.com.nomos.service.risk.MatrixConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/matrix-config")
public class MatrixConfigController {

    @Autowired
    private MatrixConfigService matrixConfigService;

    @GetMapping("/{institutionId}")
    public ResponseEntity<String> getConfig(@PathVariable UUID institutionId) {
        String config = matrixConfigService.getConfigForInstitution(institutionId);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/{institutionId}")
    public ResponseEntity<Void> saveConfig(@PathVariable UUID institutionId, @RequestBody String configJson) {
        matrixConfigService.saveConfigForInstitution(institutionId, configJson);
        return ResponseEntity.noContent().build();
    }
}
