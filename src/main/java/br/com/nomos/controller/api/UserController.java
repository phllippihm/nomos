package br.com.nomos.controller.api;

import br.com.nomos.dto.user.UserListDTO;
import br.com.nomos.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserListDTO> listUsers(@RequestParam UUID institutionId) {
        return userService.listActiveUsersByInstitution(institutionId).stream()
                .map(u -> new UserListDTO(u.getId(), u.getNome(), u.getEmail(), u.getRole().name()))
                .toList();
    }
}
