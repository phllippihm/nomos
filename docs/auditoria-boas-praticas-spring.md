# Auditoria de Boas Práticas — NOMOS Spring Boot

## Resumo Executivo

O projeto possui a **estrutura de pacotes correta** (`controller`, `service`, `repository`, `model`, `dto`, `config`, `exception`), mas **quase toda lógica de negócio está no frontend (JavaScript / localStorage)**. O Spring Boot está sendo usado apenas como servidor de templates estáticos. Isso significa que a arquitetura em camadas — que é o pilar central do Spring — **ainda não está ativa**.

---

## Diagnóstico por Categoria

### 1. Arquitetura em Camadas

| Camada | Status | Detalhe |
|--------|--------|---------|
| **Controller** | ⚠️ Apenas roteamento | `HomeController` e `NavigationController` só devolvem nomes de templates — sem lógica, validação ou `Model` |
| **Service** | ❌ Vazio | Pacote `service/` existe mas sem nenhuma classe |
| **Repository** | ❌ Vazio | Pacote `repository/` existe mas sem nenhuma classe |
| **Model / Entity** | ❌ Vazio | Pacote `model/` existe mas sem nenhuma classe |
| **DTO** | ❌ Vazio | Pacote `dto/` existe mas sem nenhuma classe |
| **Config** | ❌ Vazio | Nenhuma classe de configuração |
| **Exception** | ❌ Vazio | Sem `@ControllerAdvice` ou handler global |

> [!CAUTION]
> **100% da lógica de negócio** (CRUD de empresas, usuários, escopos, planejamento, execução, planos de ação, dashboards) está em JavaScript embutido nos templates HTML, usando `localStorage` como "banco de dados". Isso é um **anti-pattern** crítico em Spring Boot.

---

### 2. Persistência de Dados

| Item | Esperado | Atual |
|------|----------|-------|
| Banco de dados | JPA/Hibernate + PostgreSQL ou H2 | ❌ Desabilitado via `application.yaml` |
| Entidades JPA | `@Entity` com `@Table`, `@Id`, `@Column` | ❌ Nenhuma |
| Repositories | `JpaRepository<Entity, Long>` | ❌ Nenhum |
| Transações | `@Transactional` nos Services | ❌ N/A |

> [!WARNING]
> O `pom.xml` inclui `spring-boot-starter-data-jpa`, PostgreSQL e H2, mas o `application.yaml` desabilita explicitamente `DataSourceAutoConfiguration` e `HibernateJpaAutoConfiguration`. As dependências existem mas estão mortas.

---

### 3. Segurança

| Item | Esperado | Atual |
|------|----------|-------|
| Spring Security | `spring-boot-starter-security` | ❌ Ausente |
| Autenticação | Login form ou JWT/OAuth2 | ❌ Nenhuma |
| Autorização | `@PreAuthorize`, roles | ❌ JavaScript no frontend |
| CSRF | Token Thymeleaf | ❌ Não aplicado |
| CORS | Configuração explícita | ❌ Não aplicado |

---

### 4. Validação

| Item | Esperado | Atual |
|------|----------|-------|
| Bean Validation | `@Valid`, `@NotBlank`, `@Size` nos DTOs | ❌ Apenas `alert()` no JS |
| `spring-boot-starter-validation` | Presente no pom | ✅ Dependência existe, mas **não é usada** |

---

### 5. Testes

| Item | Esperado | Atual |
|------|----------|-------|
| Testes unitários | `@SpringBootTest`, `@WebMvcTest` | ❌ Zero testes |
| `src/test/java` | Mirror da estrutura `src/main/java` | ❌ Vazio (exceto scaffold) |
| `spring-boot-starter-test` | Presente no pom | ✅ Existe, mas **não é usado** |

---

### 6. Versionamento e Dependências

| Item | Observação | Severidade |
|------|-----------|-----------|
| Spring Boot `3.5.11-SNAPSHOT` | Versão não-estável, sujeita a breaking changes | ⚠️ Médio |
| Java 25 | Versão EA (early-access), não LTS | ⚠️ Médio |
| Spring AI starter | Incluído mas excluído do autoconfig — peso morto | 🟡 Baixo |

---

### 7. O Que Está Correto ✅

- **Estrutura de pacotes**: `controller`, `service`, `repository`, `model`, `dto`, `config`, `exception` — é exatamente o layout padrão *package-by-layer*
- **`NomosApplication`** no pacote raiz `br.com.nomos` — correto para component scanning
- **Thymeleaf com fragments**: `sidebar.html` como fragment reutilizável — boa prática
- **DevTools habilitado**: Hot-reload para desenvolvimento — correto
- **Cache Thymeleaf desabilitado** em dev — correto
- **Lombok configurado** com annotation processor no Maven — correto
- **Controllers são "thin"**: De fato, eles não fazem nada além de rotear — o problema é que a lógica deveria estar na Service layer, não no JavaScript

---

## Plano de Ação Recomendado

### Fase 1: Ativar o Banco de Dados (Prioridade Alta)

1. **Habilitar H2** para desenvolvimento removendo as exclusões do `application.yaml`
2. **Criar Entidades JPA**: `Empresa`, `User`, `EstruturaOrg`, `ScopeItem`, `PlanningItem`, `ExecutionRecord`, `ActionPlan`
3. **Criar Repositories** que estendem `JpaRepository`
4. **Criar Services** com `@Service` e `@Transactional` contendo toda a lógica de negócio que hoje está no JavaScript

### Fase 2: APIs REST

1. **Criar `@RestController`** para cada domínio (ou adicionar `@ResponseBody` endpoints nos controllers existentes)
2. **Criar DTOs** de request/response para não expor entidades diretamente
3. **Usar `@Valid`** nos DTOs para validação server-side
4. Os templates Thymeleaf passam a chamar esses endpoints via `fetch()` em vez de `localStorage`

### Fase 3: Segurança

1. Adicionar `spring-boot-starter-security`
2. Implementar autenticação (form login + sessão ou JWT)
3. Implementar RBAC (Master, Controller, Visualizador) no backend
4. Usar `@PreAuthorize` nos controllers/services

### Fase 4: Testes e Qualidade

1. Testes unitários para cada Service
2. Testes de integração com `@SpringBootTest` + H2
3. Testes dos controllers com `@WebMvcTest`
4. Handler global de exceções com `@ControllerAdvice`

### Fase 5: Estabilização

1. Migrar para uma versão **estável** do Spring Boot (ex: `3.4.x` GA)
2. Considerar Java 21 LTS em vez de Java 25 EA
3. Remover dependência Spring AI se não for usada imediatamente
4. Adicionar profiles (`dev`, `prod`) no `application.yaml`

---

## Conclusão

| Aspecto | Nota |
|---------|------|
| Estrutura de projeto | ⭐⭐⭐⭐ (bem organizada, falta conteúdo) |
| Uso real do Spring | ⭐ (apenas servidor de HTML estático) |
| Persistência | ⭐ (localStorage no frontend) |
| Segurança | ⭐ (inexistente) |
| Testes | ⭐ (zero) |
| Frontend/UX | ⭐⭐⭐⭐⭐ (bem construído com Tailwind + JS) |

**Veredicto**: O projeto tem uma **excelente base frontend** e a **estrutura Spring correta**, mas precisa migrar a lógica do JavaScript/localStorage para o backend (Services + JPA + REST APIs) para se tornar um projeto Spring de verdade.
