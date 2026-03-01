package br.com.nomos.repository.risk;

import br.com.nomos.domain.risk.MatrixConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MatrixConfigRepository extends JpaRepository<MatrixConfig, UUID> {
    Optional<MatrixConfig> findByInstitutionId(UUID institutionId);
}
