package br.com.nomos.repository.organization;

import br.com.nomos.domain.organization.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AreaRepository extends JpaRepository<Area, UUID> {
}
