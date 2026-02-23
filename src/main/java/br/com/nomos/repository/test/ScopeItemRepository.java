package br.com.nomos.repository.test;

import br.com.nomos.domain.test.ScopeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ScopeItemRepository extends JpaRepository<ScopeItem, UUID> {
}
