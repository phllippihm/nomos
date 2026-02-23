package br.com.nomos.repository.test;

import br.com.nomos.domain.test.PlanningItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlanningItemRepository extends JpaRepository<PlanningItem, UUID> {
    List<PlanningItem> findByScopeItemId(UUID scopeItemId);

    @Modifying
    @Query("delete from PlanningItem p where p.scopeItem.id = :scopeItemId")
    void deleteByScopeItemId(UUID scopeItemId);
}
