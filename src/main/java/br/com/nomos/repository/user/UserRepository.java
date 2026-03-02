package br.com.nomos.repository.user;

import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    UserDetails findByEmail(String email);
    List<User> findByInstitutionIdAndStatus(UUID institutionId, UserStatus status);
    List<User> findByInstitutionId(UUID institutionId);
}
