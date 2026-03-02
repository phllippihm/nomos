package br.com.nomos.service;

import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserRole;
import br.com.nomos.domain.user.UserStatus;
import br.com.nomos.dto.user.UserCreateRequestDTO;
import br.com.nomos.dto.user.UserUpdateRequestDTO;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<User> listActiveUsersByInstitution(UUID institutionId) {
        return userRepository.findByInstitutionIdAndStatus(institutionId, UserStatus.ATIVO);
    }

    @Transactional(readOnly = true)
    public List<User> listAllByInstitution(UUID institutionId) {
        return userRepository.findByInstitutionId(institutionId);
    }

    @Transactional
    public User createUser(UserCreateRequestDTO dto) {
        Institution institution = institutionRepository.findById(dto.institutionId())
                .orElseThrow(() -> new IllegalArgumentException("Instituição não encontrada"));

        if (userRepository.findByEmail(dto.email()) != null) {
            throw new IllegalArgumentException("E-mail já cadastrado: " + dto.email());
        }

        UserRole role;
        try {
            role = UserRole.valueOf(dto.role().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Perfil de acesso inválido: " + dto.role());
        }
        String rawPassword = (dto.senha() != null && !dto.senha().isBlank()) ? dto.senha() : "Nomos@2024";
        User user = new User(dto.nome(), dto.email(), passwordEncoder.encode(rawPassword),
                role, institution, UserStatus.ATIVO);
        user.setCargo(dto.cargo());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(UUID id, UserUpdateRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        user.setNome(dto.nome());
        user.setEmail(dto.email());
        try {
            user.setRole(UserRole.valueOf(dto.role().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Perfil de acesso inválido: " + dto.role());
        }
        user.setCargo(dto.cargo());
        if (dto.status() != null && !dto.status().isBlank()) {
            try {
                user.setStatus(UserStatus.valueOf(dto.status().toUpperCase()));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Status inválido: " + dto.status());
            }
        }
        return userRepository.save(user);
    }

    @Transactional
    public void deactivateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
        user.setStatus(UserStatus.INATIVO);
        userRepository.save(user);
    }
}
