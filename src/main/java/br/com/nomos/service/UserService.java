package br.com.nomos.service;

import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserStatus;
import br.com.nomos.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> listActiveUsersByInstitution(UUID institutionId) {
        return userRepository.findByInstitutionIdAndStatus(institutionId, UserStatus.ATIVO);
    }
}
