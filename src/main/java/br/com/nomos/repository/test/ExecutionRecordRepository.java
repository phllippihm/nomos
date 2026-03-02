package br.com.nomos.repository.test;

import br.com.nomos.domain.test.ExecutionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExecutionRecordRepository extends JpaRepository<ExecutionRecord, UUID> {
    @Modifying
    @Query("delete from ExecutionRecord e where e.scopeItem.id = :scopeItemId")
    void deleteByScopeItemId(UUID scopeItemId);

    java.util.Optional<ExecutionRecord> findByPlanningItemId(UUID planningItemId);

    java.util.List<ExecutionRecord> findByScopeItemId(UUID scopeItemId);
}
