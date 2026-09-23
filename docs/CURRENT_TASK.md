# Tarefa ativa

## ID

`G13-QA-01`

## Objetivo

Concluir o QA autenticado do CRM para decidir o Release Gate G13 com evidência reproduzível.

## Motivo

O lint foi encerrado em 22/09/2026 com zero erros e zero avisos. As oito suítes somam 47 testes aprovados, TypeScript e build também passam. Em 23/09/2026 foi acrescentado QA local sintético de rede para `CrmWorkspace` e `CustomerWorkspace`, cobrindo falhas de listagem/detalhe, retry, preservação de rascunhos, respostas atrasadas e idempotência de tarefas.

## Escopo permitido

- executar smoke de `/`, `/check`, `/crm` e `/crm/clientes` com dados sintéticos;
- validar por teclado os fluxos principais, foco de dialogs e mensagens de erro;
- validar tarefas, notas, vínculo/desvínculo e ciclo de clientes com autenticação local;
- ensaiar backup/restauração local e registrar limitações;
- corrigir apenas defeitos reproduzidos durante esse QA, com teste quando aplicável;
- atualizar as evidências do G13 e os arquivos de handoff.

## Fora do escopo

- criar ou conectar projeto Supabase;
- migrar D1/R2 ou aplicar migrações remotas;
- implementar Google Login, importador, contratos, agenda, financeiro ou fiscal;
- fazer deploy, alterar domínio/DNS ou usar dados reais;
- refatoração visual ampla.

## Critérios de aceite

- jornadas essenciais autenticadas funcionam sem perda ou mistura de dados;
- navegação principal funciona por teclado com foco perceptível;
- backup/restauração local possui procedimento e evidência;
- `npm run lint`, oito suítes, TypeScript e build permanecem aprovados;
- bloqueios remotos ficam claramente separados do que foi validado localmente.

## Estado

`local-g13-ready-for-remote` — QA funcional, teclado, responsividade, lifecycle, recuperação, rotas locais e rede sintética de atendimento/clientes aprovados localmente. G13 permanece aberto; não tratar como produção pronta até validação remota.

Em 23/09/2026, `npm run qa:crm-network` passou com 10/10 cenários em navegador local sintético. O teste renderiza o componente real `CrmWorkspace`, intercepta `/api/**` e valida:

- falha de detalhe com retry independente;
- falha de listagem com retry independente;
- resposta perdida em tarefa preservando rascunho e chave de idempotência;
- nota rejeitada preservando texto;
- refresh bem-sucedido sem apagar nota em edição;
- resposta tardia de nota sem limpar rascunho de outro atendimento;
- edição de payload e nova tarefa usando novas chaves;
- edição de nota durante envio preservada depois do refresh;
- erro HTML/non-JSON exibindo mensagem segura sem apagar rascunho;
- clique no mesmo atendimento com erro mantendo o estado de retry.

Em 23/09/2026, `npm run qa:customer-network` passou com 5/5 cenários em navegador local sintético. O teste renderiza o componente real `CustomerWorkspace`, intercepta `/api/**` e valida:

- falha de listagem com retry mantendo o detalhe atual;
- falha de detalhe com retry e clique no mesmo cliente mantendo o estado;
- falha ao criar contato preservando rascunho;
- falha ao criar local preservando rascunho;
- erro HTML/non-JSON no modal de edição preservando o rascunho editado.

Fechamento local em 23/09/2026:

- smoke HTTP local de `/`, `/check`, `/crm` e `/crm/clientes`: PASS, HTTP 200;
- `npm run qa:recovery`: PASS, 14 arquivos, 16 tabelas, integridade local restaurada;
- `npm run qa:preflight`: PASS para bindings e migrações; Git comparison retornou WARNING por `EPERM` no sandbox;
- `node node_modules\typescript\bin\tsc --noEmit --incremental false`: PASS;
- `npm run lint`: PASS;
- `npm run qa:crm-network`: PASS, 10/10;
- `npm run qa:customer-network`: PASS, 5/5;
- `npm run qa:remote-checks`: PASS, 2/2;
- `npm run qa:remote-evidence`: PASS;
- `npm run build`: PASS.

O preflight local de release está disponível em `npm run qa:preflight`. Ele lista hashes SHA-256 das migrações D1 0000–0005, confere a sequência e mostra o estado Git local. O comando é somente leitura e **não** verifica aplicação de migrações, backup, restauração nem deploy remotos. Em seu primeiro ensaio, `origin/main` estava 7 commits atrás do HEAD local.

O checklist local de prontidão remota está disponível em `npm run qa:remote-readiness`. Ele confere arquivos obrigatórios, manifesto de hospedagem, journal/migrações, ferramentas locais, estado Git e variáveis esperadas para a validação remota. O comando não usa credenciais, não lê dados reais e não executa migração, deploy, DNS ou importação.

O runbook da etapa remota está em `.icbai/artifacts/REMOTE_G13_RUNBOOK.md`. Ele organiza a sequência de validação, os critérios de parada e as evidências que precisam ser registradas antes de qualquer proposta de publicação ou cutover. O template `.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md` existe para coletar evidências sem segredos ou dados reais. O comando `npm run qa:remote-evidence` faz uma varredura local inicial contra tokens, chaves, e-mails, CPF/CNPJ e dumps SQL antes de versionar ou compartilhar evidências.

Consulta de leitura à hospedagem em 22/09/2026 identificou a versão 3 publicada com sucesso no commit `98c0bbf3590536b9b078f5ae0611302ae5fd8393`, 11 commits atrás do HEAD local naquele momento. O overview do D1 remoto `DB` listou oito tabelas: `attachments`, `crm_tasks`, `events`, `lead_activities`, `leads`, `outbox`, `rate_limits` e `service_records`. A tabela de migrações e a integridade dos dados remotos ainda não foram verificadas; nenhuma alteração remota foi feita.

## Próximo passo

Próximo passo: organizar Git e preparar a validação remota de migrações, recuperação, configuração e performance em etapa separadamente autorizada. Não iniciar Supabase nem deploy sem ambiente e credenciais confirmados.

## Checklist da etapa remota

1. CONCLUÍDO em leitura: ambiente Sites identificado, versão 3 publicada em `98c0bbf`, 11 commits atrás do HEAD local no momento da consulta.
2. CONCLUÍDO localmente: criar check `npm run qa:remote-readiness` para listar pré-requisitos e bloqueios antes da etapa remota.
3. CONCLUÍDO localmente: criar runbook `.icbai/artifacts/REMOTE_G13_RUNBOOK.md` com sequência, evidências e critérios de parada.
4. CONCLUÍDO localmente: criar template `.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md` e listar variáveis remotas vazias em `.env.example`.
5. CONCLUÍDO localmente: criar `npm run qa:remote-evidence` para varrer evidências remotas antes de versionar ou compartilhar.
6. Conferir quais migrações D1 0003–0005 foram aplicadas e fazer backup antes de qualquer upgrade.
7. Ensaiar restauração em ambiente isolado e conferir contagens, vínculos e integridade sem copiar dados reais para o repositório.
8. Executar smoke autenticado com registros sintéticos e papéis de administrador/atendimento.
9. Medir Core Web Vitals no domínio final, revisar logs, monitoramento, retenção e rollback.
10. Registrar PASS/FAIL/WARNING por dimensão na matriz G13 antes de propor cutover ou publicação.
