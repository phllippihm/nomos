package br.com.nomos.controller.api;

import br.com.nomos.dto.user.UserCreateRequestDTO;
import br.com.nomos.dto.user.UserListDTO;
import br.com.nomos.dto.user.UserUpdateRequestDTO;
import br.com.nomos.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserListDTO> listUsers(@RequestParam UUID institutionId,
            @RequestParam(defaultValue = "false") boolean all) {
        var users = all
                ? userService.listAllByInstitution(institutionId)
                : userService.listActiveUsersByInstitution(institutionId);
        return users.stream()
                .map(u -> new UserListDTO(
                        u.getId(), u.getNome(), u.getEmail(),
                        u.getRole().name(), u.getCargo(),
                        u.getStatus().name(),
                        u.getInstitution().getId()))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserListDTO createUser(@RequestBody @Valid UserCreateRequestDTO dto) {
        var u = userService.createUser(dto);
        return new UserListDTO(u.getId(), u.getNome(), u.getEmail(),
                u.getRole().name(), u.getCargo(), u.getStatus().name(),
                u.getInstitution().getId());
    }

    @PutMapping("/{id}")
    public UserListDTO updateUser(@PathVariable UUID id, @RequestBody @Valid UserUpdateRequestDTO dto) {
        var u = userService.updateUser(id, dto);
        return new UserListDTO(u.getId(), u.getNome(), u.getEmail(),
                u.getRole().name(), u.getCargo(), u.getStatus().name(),
                u.getInstitution().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
    }
}
