package br.com.nomos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class NavigationController {

    @GetMapping("/parametrizar-matrizes")
    public String parametrizarMatrizes() {
        return "parametrizar-matrizes";
    }

    @GetMapping("/escopo-testes")
    public String escopoTestes() {
        return "escopo-testes";
    }

    @GetMapping("/planejamento")
    public String planejamento() {
        return "planejamento";
    }

    @GetMapping("/execucao")
    public String execucao() {
        return "execucao";
    }

    @GetMapping("/planos-acao")
    public String planosAcao() {
        return "planos-acao";
    }

    @GetMapping("/dashboards")
    public String dashboards() {
        return "dashboards";
    }

    @GetMapping("/gestao-usuarios")
    public String gestaoUsuarios() {
        return "gestao-usuarios";
    }
}
