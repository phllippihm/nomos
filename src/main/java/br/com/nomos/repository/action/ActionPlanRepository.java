package br.com.nomos.repository.action;

import br.com.nomos.domain.action.ActionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActionPlanRepository extends JpaRepository<ActionPlan, UUID> {

    // Finds all action plans optionally filtering by status
    List<ActionPlan> findAllByOrderByCreatedAtDesc();

    // Future: findAllByInstitutionId
}
