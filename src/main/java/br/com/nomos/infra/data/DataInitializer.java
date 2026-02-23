package br.com.nomos.infra.data;

import br.com.nomos.domain.organization.Area;
import br.com.nomos.domain.organization.Directorate;
import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserRole;
import br.com.nomos.domain.user.UserStatus;
import br.com.nomos.repository.organization.AreaRepository;
import br.com.nomos.repository.organization.DirectorateRepository;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final InstitutionRepository institutionRepository;
    private final DirectorateRepository directorateRepository;
    private final AreaRepository areaRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Institution jsPrime = institutionRepository.findAll().stream()
                .filter(i -> i.getNome().equalsIgnoreCase("JS Prime"))
                .findFirst()
                .orElseGet(() -> institutionRepository.save(new Institution("JS Prime")));

        Directorate dirOperacoes = null;
        if (directorateRepository.findAll().stream()
                .noneMatch(d -> d.getNome().equalsIgnoreCase("Diretoria de Operações"))) {
            dirOperacoes = new Directorate("Diretoria de Operações", jsPrime);
            directorateRepository.save(dirOperacoes);
        } else {
            dirOperacoes = directorateRepository.findAll().stream()
                    .filter(d -> d.getNome().equalsIgnoreCase("Diretoria de Operações")).findFirst().get();
        }

        Directorate dirProdutos = null;
        if (directorateRepository.findAll().stream()
                .noneMatch(d -> d.getNome().equalsIgnoreCase("Diretoria de Produtos"))) {
            dirProdutos = new Directorate("Diretoria de Produtos", jsPrime);
            directorateRepository.save(dirProdutos);
        } else {
            dirProdutos = directorateRepository.findAll().stream()
                    .filter(d -> d.getNome().equalsIgnoreCase("Diretoria de Produtos")).findFirst().get();
        }

        if (areaRepository.findAll().stream().noneMatch(a -> a.getNome().equalsIgnoreCase("Qualidade e Laboratório"))) {
            areaRepository.save(new Area("Qualidade e Laboratório", dirOperacoes));
            areaRepository.save(new Area("Engenharia", dirOperacoes));
        }

        if (areaRepository.findAll().stream()
                .noneMatch(a -> a.getNome().equalsIgnoreCase("Pesquisa e Desenvolvimento"))) {
            areaRepository.save(new Area("Pesquisa e Desenvolvimento", dirProdutos));
        }

        if (userRepository.findByEmail("admin@nomos.com") == null) {
            User admin = new User(
                    "Administrator",
                    "admin@nomos.com",
                    passwordEncoder.encode("senha-segura"),
                    UserRole.ADMIN,
                    jsPrime,
                    UserStatus.ATIVO);
            userRepository.save(admin);
        }
    }
}
