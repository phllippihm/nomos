# Guia de Testes Práticos: Sistema Nomos

Bem-vindo(a) ao Guia de Testes do **Nomos**.
O Nomos é um sistema de GRC (Governança, Risco e Compliance) desenhado para garantir que os testes de conformidade da sua empresa sejam planejados, executados e, em caso de falha, devidamente corrigidos.

Neste guia, você vai aprender a usar a ferramenta simulando um cenário real do dia a dia de um auditor.

---

## 🎯 O Cenário de Teste (O que vamos fazer?)

Imagine que você é um **Auditor de Qualidade**. Sua tarefa neste mês é verificar se os "Servidores de Banco de Dados" estão com o backup em dia. 

Se eles estiverem desatualizados, isso é um risco altíssimo, e o sistema deverá forçar você a criar um Plano de Ação para corrigir isso imediatamente.

Siga os **5 Passos** abaixo.

---

## 📝 Passo 1: Criando a Regra do Jogo (Parametrizar Matrizes)
Antes de auditar, precisamos ensinar ao sistema o que é um risco inaceitável.

1. Acesse o menu lateral e clique em **Parametrizar Matrizes**.
2. Clique na aba **Conformidade** (no topo).
3. Na tabela, encontre a linha vermelha que vai de `0 a 49`. Troque o nome dela (ex: de "Crítico" para **"CRÍTICO - FALHA GRAVE"**).
4. Clique na aba **Manutenção**.
5. Observe a matriz que cruza o Risco com a Conformidade. Para a coluna que você acabou de renomear ("CRÍTICO - FALHA GRAVE"), garanta que todas as caixinhas vermelhas estejam marcadas como **"Necessita plano de ação"**. Se não estiverem, clique nelas até ficarem vermelhas.

---

## 📋 Passo 2: Definindo o que será testado (Escopo de Testes)
Agora vamos registrar o nosso teste de backup.

1. Vá para o menu **Escopo de Testes**.
2. Clique no botão azul **Adicionar Fator de Risco**.
3. Preencha o formulário:
   * **Fator de Risco:** "Teste de Backup dos Servidores"
   * **Área:** Tecnologia da Informação
   * **Periodicidade:** Mensal
   * **Mês de Início:** Janeiro
   * **Probabilidade:** 5 (Muito Provável)
   * **Impacto:** 5 (Catastrófico)
   * **Finalidade e Base Normativa:** Pode colocar "Verificar integridade segundo a ISO 27001".
4. Clique em **Salvar**. *Note que a nota de Risco será 25 (Nível ALTO Vermelho).*

---

## 📅 Passo 3: Agendando a Auditoria (Planejamento)
Você registrou o teste, mas precisa dizer ao sistema *quando* vai fazê-lo.

1. Vá para o menu **Planejamento**.
2. Encontre a linha do "Teste de Backup dos Servidores".
3. Na coluna do **Mês Atual** (ex: o mês em que estamos agora), clique no pequeno cartão cinza que diz "Planejar".
4. Confirme clicando em **Agendar**.
5. O cartão ficará com um ícone verde mostrando que a auditoria está oficialmente prevista para este mês.

---

## 👷 Passo 4: Mão na Massa! (Execução)
Chegou o dia de ir na sala dos servidores verificar o backup. Você descobre que o backup falhou nos últimos 3 dias!

1. Vá para o menu **Execução**.
2. Na caixa "Ações Pendentes (Mês Corrente)", você verá o seu teste lá. Clique no botão **Executar**.
3. Preencha os dados do desastre:
   * **Status da Execução:** Mude para `Executado`.
   * **Resultado de Controle:** Arraste a barra para uma nota bem baixa (abaixo de 49%), selecionando o nível **"CRÍTICO - FALHA GRAVE"**.
   * **Ação Tomada:** "Backup inoperante. Risco de perda de dados iminente."
4. Clique no botão azul escuro **Salvar e Fechar**.

> 💡 **A Mágica do Sistema:** Como a nota foi Crítica, o Nomos acabou de cruzar essa informação com a Matriz do Passo 1 e gerou um alerta vermelho nos bastidores!

---

## 🚒 Passo 5: Apagando o Incêndio (Planos de Ação)
Um erro grave não pode virar apenas uma anotação em planilha. Ele precisa ser corrigido.

1. Vá para o menu **Planos de Ação**.
2. Olhe a aba **Ações Pendentes**. Surpresa! O sistema gerou automaticamente um plano de ação rascunho (Draft) para o seu teste de Backup.
3. Clique no botão **Abrir** na linha desse plano.
4. No painel que se abre à direita, o sistema está dizendo: *"Ok, deu problema. Como vamos consertar?"*. 
5. Clique em **Adicionar Etapa de Correção**:
   * **Nome da Etapa:** "Trocar HD do servidor urgemente"
   * **Custo:** 1500
   * **Responsável:** Root
   * Salve.
6. Digamos que o HD chegou e você instalou. Clique na **bolinha vazia** ao lado do nome da sua etapa para marcá-la como concluída. A barra de progresso vai para 100%.
7. Um grande botão verde **CONCLUIR PLANO DE AÇÃO** aparecerá no topo. Clique nele e confirme.

---

## ✅ Fim do Tour
As pendências sumiram e você será redirecionado automaticamente para a aba **Histórico Concluído**. O seu plano de ação foi formalmente finalizado e arquivado para qualquer futura consultoria visualizar.

Você fechou o **Loop de GRC Completo**! Parabéns. 🎉
