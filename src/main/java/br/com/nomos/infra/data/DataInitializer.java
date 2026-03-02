package br.com.nomos.infra.data;

import br.com.nomos.domain.action.ActionPlan;
import br.com.nomos.domain.action.ActionPlanMessage;
import br.com.nomos.domain.action.ActionPlanStep;
import br.com.nomos.domain.organization.Area;
import br.com.nomos.domain.organization.Directorate;
import br.com.nomos.domain.organization.Institution;
import br.com.nomos.domain.test.ExecutionRecord;
import br.com.nomos.domain.test.PlanningItem;
import br.com.nomos.domain.test.ScopeItem;
import br.com.nomos.domain.user.User;
import br.com.nomos.domain.user.UserRole;
import br.com.nomos.domain.user.UserStatus;
import br.com.nomos.repository.action.ActionPlanRepository;
import br.com.nomos.repository.organization.AreaRepository;
import br.com.nomos.repository.organization.DirectorateRepository;
import br.com.nomos.repository.organization.InstitutionRepository;
import br.com.nomos.repository.test.ExecutionRecordRepository;
import br.com.nomos.repository.test.PlanningItemRepository;
import br.com.nomos.repository.test.ScopeItemRepository;
import br.com.nomos.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final InstitutionRepository institutionRepository;
    private final DirectorateRepository directorateRepository;
    private final AreaRepository areaRepository;
    private final UserRepository userRepository;
    private final ScopeItemRepository scopeItemRepository;
    private final PlanningItemRepository planningItemRepository;
    private final ExecutionRecordRepository executionRecordRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Idempotent: skip if data already exists
        if (userRepository.findByEmail("admin@nomos.com") != null) {
            return;
        }

        // ── Institution ──
        Institution jsPrime = institutionRepository.save(new Institution("JS Prime"));

        // ── Directorates ──
        Directorate dirOperacoes = directorateRepository.save(new Directorate("Diretoria de Operações", jsPrime));
        Directorate dirTecnologia = directorateRepository.save(new Directorate("Diretoria de Tecnologia", jsPrime));
        Directorate dirRH = directorateRepository.save(new Directorate("Diretoria de Recursos Humanos", jsPrime));
        Directorate dirComercial = directorateRepository.save(new Directorate("Diretoria Comercial", jsPrime));
        Directorate dirProdutos = directorateRepository.save(new Directorate("Diretoria de Produtos", jsPrime));

        // ── Areas ──
        Area qualidade = areaRepository.save(new Area("Qualidade e Laboratório", dirOperacoes));
        Area engenharia = areaRepository.save(new Area("Engenharia", dirOperacoes));
        Area logistica = areaRepository.save(new Area("Logística", dirOperacoes));
        Area manutencao = areaRepository.save(new Area("Manutenção", dirOperacoes));
        Area producao = areaRepository.save(new Area("Produção", dirOperacoes));

        Area devSistemas = areaRepository.save(new Area("Desenvolvimento de Sistemas", dirTecnologia));
        Area infraestrutura = areaRepository.save(new Area("Infraestrutura", dirTecnologia));
        Area segInfo = areaRepository.save(new Area("Segurança da Informação", dirTecnologia));
        Area software = areaRepository.save(new Area("Software", dirTecnologia));

        Area recrutamento = areaRepository.save(new Area("Recrutamento e Seleção", dirRH));
        Area dpessoal = areaRepository.save(new Area("Departamento Pessoal", dirRH));
        Area segTrabalho = areaRepository.save(new Area("Segurança do Trabalho", dirRH));

        Area vendasB2B = areaRepository.save(new Area("Vendas B2B", dirComercial));
        Area marketing = areaRepository.save(new Area("Marketing", dirComercial));
        Area customerSuccess = areaRepository.save(new Area("Customer Success", dirComercial));

        Area pesquisaDev = areaRepository.save(new Area("Pesquisa e Desenvolvimento", dirProdutos));

        // ── Users ──
        userRepository.save(new User("Administrator", "admin@nomos.com",
                passwordEncoder.encode("senha-segura"), UserRole.ADMIN, jsPrime, UserStatus.ATIVO));
        userRepository.save(new User("Carlos Mendes", "carlos@nomos.com",
                passwordEncoder.encode("senha-segura"), UserRole.CONTROLLER, jsPrime, UserStatus.ATIVO));
        userRepository.save(new User("Ana Costa", "ana@nomos.com",
                passwordEncoder.encode("senha-segura"), UserRole.USER, jsPrime, UserStatus.ATIVO));

        // ── Scope Items (Fatores de Risco) ──
        ScopeItem acessoLogico = scopeItemRepository.save(new ScopeItem(
                "Auditoria de Acesso Lógico", "Verificar permissões de acesso a sistemas críticos",
                devSistemas, "Mensal", "Janeiro", "ISO 27001 / LGPD", 4, 5));
        acessoLogico.setTagArea("TI-SEC");
        scopeItemRepository.save(acessoLogico);

        ScopeItem backupServidores = scopeItemRepository.save(new ScopeItem(
                "Backup de Servidores", "Validar integridade e restauração de backups",
                infraestrutura, "Mensal", "Janeiro", "ISO 27001 A.12.3", 2, 5));

        ScopeItem codeReview = scopeItemRepository.save(new ScopeItem(
                "Code Review", "Revisão de código para identificar vulnerabilidades",
                software, "Mensal", "Janeiro", "OWASP Top 10", 3, 3));

        ScopeItem folhaPagamento = scopeItemRepository.save(new ScopeItem(
                "Revisão de Folha de Pagamento", "Conferência de cálculos trabalhistas e encargos",
                dpessoal, "Trimestral", "Janeiro", "CLT / eSocial", 3, 4));
        folhaPagamento.setTagArea("RH-PAY");
        scopeItemRepository.save(folhaPagamento);

        ScopeItem concBancaria = scopeItemRepository.save(new ScopeItem(
                "Conciliação Bancária", "Verificar correspondência entre extratos e lançamentos contábeis",
                dpessoal, "Mensal", "Janeiro", "CPC 03 / NBC TG 03", 2, 5));

        ScopeItem inspecaoVeiculos = scopeItemRepository.save(new ScopeItem(
                "Inspeção de Veículos", "Verificar estado da frota e documentação obrigatória",
                logistica, "Semestral", "Fevereiro", "CONTRAN / NR-11", 4, 3));

        ScopeItem analiseContratos = scopeItemRepository.save(new ScopeItem(
                "Análise de Contratos", "Revisão de cláusulas contratuais e conformidade jurídica",
                vendasB2B, "Trimestral", "Março", "Código Civil / CDC", 3, 5));

        ScopeItem inventarioFrota = scopeItemRepository.save(new ScopeItem(
                "Inventário de Frota", "Contagem física e verificação de ativos da frota",
                logistica, "Mensal", "Janeiro", "CPC 27 / NR-11", 4, 5));

        ScopeItem qualidadeProduto = scopeItemRepository.save(new ScopeItem(
                "Controle de Qualidade de Produto", "Inspeção de lotes e testes de conformidade",
                qualidade, "Mensal", "Janeiro", "ISO 9001 / ABNT NBR", 3, 4));

        // ── Planning Items (Jan-Jun 2026) ──
        String[] meses = {"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"};
        int ano = 2026;

        // Mensal scopes: generate Jan-Jun
        ScopeItem[] mensais = {acessoLogico, backupServidores, codeReview, concBancaria, inventarioFrota, qualidadeProduto};
        PlanningItem[][] planMensais = new PlanningItem[mensais.length][6];
        for (int s = 0; s < mensais.length; s++) {
            for (int m = 0; m < 12; m++) {
                PlanningItem pi = planningItemRepository.save(
                        new PlanningItem(mensais[s], meses[m], ano, m < 2 ? "Realizado" : "Planejado"));
                if (m < 6) planMensais[s][m] = pi;
            }
        }

        // Trimestral: folhaPagamento (Jan, Abr, Jul, Out), analiseContratos (Mar, Jun, Set, Dez)
        PlanningItem planFolhaJan = planningItemRepository.save(new PlanningItem(folhaPagamento, "Janeiro", ano, "Realizado"));
        planningItemRepository.save(new PlanningItem(folhaPagamento, "Abril", ano, "Planejado"));
        planningItemRepository.save(new PlanningItem(folhaPagamento, "Julho", ano, "Planejado"));
        planningItemRepository.save(new PlanningItem(folhaPagamento, "Outubro", ano, "Planejado"));

        PlanningItem planContratosMarco = planningItemRepository.save(new PlanningItem(analiseContratos, "Março", ano, "Realizado"));
        planningItemRepository.save(new PlanningItem(analiseContratos, "Junho", ano, "Planejado"));
        planningItemRepository.save(new PlanningItem(analiseContratos, "Setembro", ano, "Planejado"));
        planningItemRepository.save(new PlanningItem(analiseContratos, "Dezembro", ano, "Planejado"));

        // Semestral: inspecaoVeiculos (Fev, Ago)
        PlanningItem planVeiculosFev = planningItemRepository.save(new PlanningItem(inspecaoVeiculos, "Fevereiro", ano, "Realizado"));
        planningItemRepository.save(new PlanningItem(inspecaoVeiculos, "Agosto", ano, "Planejado"));

        // ── Execution Records ──

        // Janeiro - Acesso Lógico: 90% conformidade -> ação corretiva
        ExecutionRecord execAcesso = createExecution(acessoLogico, planMensais[0][0],
                LocalDateTime.of(2026, 1, 15, 10, 0), "João Silva", 50, 5,
                "5 contas de ex-funcionários ainda ativas", "Corretiva");

        // Janeiro - Backup: 95% conformidade -> OK
        createExecution(backupServidores, planMensais[1][0],
                LocalDateTime.of(2026, 1, 15, 10, 0), "Carlos Mendes", 100, 5,
                "5 backups com checksum inválido", null);

        // Janeiro - Code Review: 60% conformidade -> preocupante
        ExecutionRecord execCodeReview = createExecution(codeReview, planMensais[2][0],
                LocalDateTime.of(2026, 1, 20, 10, 0), "Ana Costa", 100, 40,
                "40 PRs sem review aprovado; SQL injection em 3 endpoints", "Corretiva");

        // Janeiro - Folha Pagamento: 80% -> ação corretiva
        ExecutionRecord execFolha = createExecution(folhaPagamento, planFolhaJan,
                LocalDateTime.of(2026, 1, 20, 14, 30), "Maria Souza", 100, 20,
                "Divergência em 20 holerites: horas extras não computadas", "Corretiva");

        // Janeiro - Inventário de Frota: 30% -> crítico
        ExecutionRecord execFrota = createExecution(inventarioFrota, planMensais[4][0],
                LocalDateTime.of(2026, 1, 25, 10, 0), "Pedro Lima", 100, 70,
                "70 veículos sem documentação atualizada; 15 com IPVA vencido", "Emergencial");

        // Fevereiro - Conciliação Bancária: 100% -> perfeito
        createExecution(concBancaria, planMensais[3][1],
                LocalDateTime.of(2026, 2, 5, 9, 15), "Carlos Mendes", 200, 0, null, "Nenhuma");

        // Fevereiro - Backup: 100%
        createExecution(backupServidores, planMensais[1][1],
                LocalDateTime.of(2026, 2, 10, 10, 0), "Carlos Mendes", 100, 0, null, null);

        // Fevereiro - Inspeção Veículos: 50% -> emergencial
        ExecutionRecord execVeiculos = createExecution(inspecaoVeiculos, planVeiculosFev,
                LocalDateTime.of(2026, 2, 18, 11, 0), "Ana Costa", 30, 15,
                "15 veículos com pneus abaixo do limite; 3 com freios comprometidos", "Emergencial");

        // Março - Análise de Contratos: 90% -> preventiva
        createExecution(analiseContratos, planContratosMarco,
                LocalDateTime.of(2026, 3, 10, 16, 45), "Rafael Alves", 10, 1,
                "1 contrato sem cláusula de LGPD", "Preventiva");

        // ── Action Plans ──

        // Plan 1: Acesso Lógico (ACTIVE - em andamento)
        ActionPlan planAcesso = new ActionPlan(execAcesso,
                "Revogar acessos pendentes e revisar política de offboarding", "Sistema");
        planAcesso.setStatus("ACTIVE");
        planAcesso.addMessage(new ActionPlanMessage(planAcesso, "SYSTEM",
                "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado.", "Sistema"));
        planAcesso.addStep(new ActionPlanStep(planAcesso,
                "Revogar imediatamente as 5 contas de ex-funcionários", "João Silva", LocalDate.of(2026, 1, 20)));
        planAcesso.getSteps().get(0).setDone(true);
        planAcesso.addStep(new ActionPlanStep(planAcesso,
                "Implementar processo automático de desligamento no AD", "Carlos Mendes", LocalDate.of(2026, 2, 28)));
        actionPlanRepository.save(planAcesso);

        // Plan 2: Folha de Pagamento (ACTIVE)
        ActionPlan planFolhaPag = new ActionPlan(execFolha,
                "Auditoria profunda da folha de pagamento com a contabilidade", "Sistema");
        planFolhaPag.setStatus("ACTIVE");
        planFolhaPag.addMessage(new ActionPlanMessage(planFolhaPag, "SYSTEM",
                "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado.", "Sistema"));
        planFolhaPag.addStep(new ActionPlanStep(planFolhaPag,
                "Recalcular horas extras dos 20 colaboradores afetados", "Maria Souza", LocalDate.of(2026, 2, 15)));
        planFolhaPag.addStep(new ActionPlanStep(planFolhaPag,
                "Implantar validação dupla no sistema de folha", "Carlos Mendes", LocalDate.of(2026, 3, 31)));
        actionPlanRepository.save(planFolhaPag);

        // Plan 3: Inspeção Veículos (COMPLETED)
        ActionPlan planVeic = new ActionPlan(execVeiculos,
                "Troca imediata de pneus e revisão de freios em toda a frota", "Sistema");
        planVeic.setStatus("COMPLETED");
        planVeic.setCompletedAt(LocalDateTime.of(2026, 2, 20, 17, 0));
        planVeic.addMessage(new ActionPlanMessage(planVeic, "SYSTEM",
                "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado.", "Sistema"));
        planVeic.addMessage(new ActionPlanMessage(planVeic, "SYSTEM",
                "Plano finalizado pelo usuário", "Sistema"));
        ActionPlanStep stepVeic = new ActionPlanStep(planVeic,
                "Trocar pneus dos 15 veículos identificados", "Pedro Lima", LocalDate.of(2026, 2, 25));
        stepVeic.setDone(true);
        planVeic.addStep(stepVeic);
        actionPlanRepository.save(planVeic);

        // Plan 4: Code Review (DRAFT - aguardando preenchimento)
        ActionPlan planCode = new ActionPlan(execCodeReview, "", "Sistema");
        planCode.addMessage(new ActionPlanMessage(planCode, "SYSTEM",
                "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado.", "Sistema"));
        actionPlanRepository.save(planCode);

        // Plan 5: Inventário Frota (ACTIVE - crítico)
        ActionPlan planInvFrota = new ActionPlan(execFrota,
                "Regularização urgente da documentação de toda a frota", "Sistema");
        planInvFrota.setStatus("ACTIVE");
        planInvFrota.addMessage(new ActionPlanMessage(planInvFrota, "SYSTEM",
                "Plano de ação gerado automaticamente a partir de baixa conformidade no teste executado.", "Sistema"));
        planInvFrota.addStep(new ActionPlanStep(planInvFrota,
                "Regularizar IPVA dos 15 veículos pendentes", "Pedro Lima", LocalDate.of(2026, 2, 10)));
        planInvFrota.addStep(new ActionPlanStep(planInvFrota,
                "Atualizar documentação dos 70 veículos", "Ana Costa", LocalDate.of(2026, 3, 15)));
        planInvFrota.addStep(new ActionPlanStep(planInvFrota,
                "Implantar controle mensal automatizado de vencimentos", "Carlos Mendes", LocalDate.of(2026, 4, 30)));
        actionPlanRepository.save(planInvFrota);
    }

    private ExecutionRecord createExecution(ScopeItem scope, PlanningItem planning,
            LocalDateTime testDate, String responsible,
            double sampleSize, double nonConforming,
            String nonConformities, String actionTaken) {

        ExecutionRecord record = new ExecutionRecord();
        record.setScopeItem(scope);
        record.setPlanningItem(planning);
        record.setTestDate(testDate);
        record.setResponsible(responsible);
        record.setSampleSize(sampleSize);
        record.setNonConforming(nonConforming);
        record.setConforming(sampleSize - nonConforming);
        record.setNonConformities(nonConformities);
        record.setActionTaken(actionTaken);

        double pc = ((sampleSize - nonConforming) / sampleSize) * 100.0;
        record.setConformityPercentage(BigDecimal.valueOf(pc).setScale(2, RoundingMode.HALF_UP));

        return executionRecordRepository.save(record);
    }
}
