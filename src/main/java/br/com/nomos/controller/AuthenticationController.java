package br.com.nomos.controller;

import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.user.AuthenticationDTO;
import br.com.nomos.domain.user.LoginResponseDTO;
import br.com.nomos.domain.user.RegisterDTO;
import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserResponseDTO;
import br.com.nomos.domain.user.UserStatus;
import br.com.nomos.infra.security.TokenService;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.user.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository repository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody AuthenticationDTO data, HttpServletResponse response) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.email(), data.senha());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var token = tokenService.generateToken((User) auth.getPrincipal());

        // Criar Cookie HttpOnly (Segurança @security-auditor)
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Em produção, definir como TRUE (apenas HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(8 * 60 * 60); // 8 horas (Sincronizado com TokenService)
        response.addCookie(cookie);

        return ResponseEntity.ok(new LoginResponseDTO(token));
    }

    @PostMapping("/logout")
    public ResponseEntity logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Expira o cookie imediatamente
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody RegisterDTO data) {
        if (this.repository.findByEmail(data.email()) != null) {
            return ResponseEntity.badRequest().build();
        }

        String encryptedPassword = passwordEncoder.encode(data.senha());

        // Simples lógica para MVP: buscar instituição pelo nome ou criar se não existir
        Institution institution = institutionRepository.findAll().stream()
                .filter(i -> i.getNome().equalsIgnoreCase(data.instituicao()))
                .findFirst()
                .orElseGet(() -> institutionRepository.save(new Institution(data.instituicao())));

        User newUser = new User(data.nome(), data.email(), encryptedPassword, data.role(), institution,
                UserStatus.ATIVO);

        this.repository.save(newUser);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me() {
        var principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return ResponseEntity.ok(new UserResponseDTO(user));
        }
        return ResponseEntity.status(401).build();
    }
}
