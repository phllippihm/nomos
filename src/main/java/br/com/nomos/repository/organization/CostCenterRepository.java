package br.com.nomos.repository.organization;

import br.com.nomos.domain.organization.CostCenter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CostCenterRepository extends JpaRepository<CostCenter, UUID> {
    List<CostCenter> findByInstitutionId(UUID institutionId);
}
