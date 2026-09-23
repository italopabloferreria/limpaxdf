# LIMPAX — handoff atual

Atualizado em 23/09/2026. Repositório canônico: `C:/Users/italo/Programação/Limpax`.

## Sessão 2026-09-23 — Supabase prep

Foi criado o pacote `docs/supabase/` para preparar a migração futura para Supabase sem alterar o sistema atual. O pacote contém mapeamento D1/R2 → Supabase, plano operacional de execução e rascunho SQL de PostgreSQL/RLS/Storage. Esta etapa é documentação técnica: não conecta projeto Supabase, não salva credenciais, não aplica migrations, não lê dados reais e não substitui Cloudflare/D1/R2.

O rascunho considera PostgreSQL, Auth Google, `crm_user_profiles` para papéis `admin` e `attendant`, RLS em todas as tabelas expostas, buckets privados para uploads/importações/templates/documentos/backups e bloqueio de `service_role` no cliente. A execução real exige projeto Supabase vazio de homologação, região/plano confirmados, callbacks Google, e-mails dos dois administradores, destino externo de backup e validação com advisors antes de qualquer cutover.
## Sessão 2026-09-23

`G13-QA-01` foi expandido com QA sintético de rede do CRM. `CrmWorkspace` agora separa erro de listagem, erro de detalhe e erro de mutação; preserva rascunhos quando POST falha, quando a resposta chega tarde ou quando há refresh bem-sucedido; mantém o retry ao clicar no mesmo atendimento com erro aberto; e guarda chaves de idempotência por payload de tarefa, permitindo voltar a uma tentativa incerta sem gerar nova chave.

Foi criado `npm run qa:crm-network`, que renderiza o componente real em navegador local, intercepta `/api/**` e cobre 10 cenários de rede/retry sem dados reais. Resultado fresco: 10/10 PASS.

`CustomerWorkspace` recebeu o mesmo padrão de tratamento: erro de listagem e detalhe separados com retry, preservação de rascunhos nos formulários inline de contato/local e fallback seguro para erro HTML/non-JSON em modais. Foi criado `npm run qa:customer-network`; resultado fresco: 5/5 PASS.

Também passaram `node node_modules\typescript\bin\tsc --noEmit --incremental false`, `npm run lint`, `npm run qa:crm-network`, `npm run qa:customer-network`, `npm run qa:remote-checks` e `npm run build`.

G13 continua aberto. Esta rodada não conectou Supabase, não fez deploy, não alterou domínio/DNS, não aplicou migração remota e não usou dados reais.

## Sessão 2026-09-22

`G13-LINT-01` foi concluído. O ESLint ignora `.sites-runtime/**`, artefato gerado, e termina com zero erros e zero avisos sem desativação global de regras. Foram corrigidos links internos, efeitos React e tipos nos handlers, componentes, utilitários e testes. As oito suítes somam 47/47 testes aprovados; TypeScript e build também passam. G13 continua FAIL apenas pelos itens de QA e recuperação ainda pendentes.

`G13-QA-01` concluiu a parte local no repositório canônico. No navegador autenticado, foram validados tarefa, nota, cliente sintético, vínculo, histórico, arquivamento e restauração com relações preservadas. Um clique duplo reproduziu nota duplicada; `CrmWorkspace` agora bloqueia mutações concorrentes. A confirmação nativa de lifecycle foi substituída por diálogo acessível com foco inicial, cancelamento e retorno ao acionador. O ensaio `npm run qa:recovery` restaurou 14 arquivos com hashes idênticos e integridade SQLite de 16 tabelas. Teclado, formulário obrigatório, 390 × 844 e contraste local também passaram. As quatro rotas responderam entre 62 ms e 117 ms em ambiente aquecido; isso não equivale a Core Web Vitals de produção.

`npm run qa:preflight` foi acrescentado como verificação local somente de leitura. Confere bindings, journal e sequência das seis migrações D1 e emite hashes SHA-256. Compara o HEAD ao upstream local; no primeiro ensaio, `origin/main` estava 7 commits atrás. O comando isolado não verifica aplicação remota, backup, restauração ou deploy.

`npm run qa:remote-readiness` foi acrescentado e executado como checklist local de preparação da etapa remota. Ele valida presença dos arquivos de estado, manifesto de hospedagem, journal/migrações, ferramentas locais, estado Git e variáveis esperadas (`CF_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `LIMPAX_REMOTE_ENV`, `LIMPAX_RELEASE_OPERATOR`, `LIMPAX_ROLLBACK_PLAN_CONFIRMED`). Ele não usa credenciais, não executa migração, não publica e não lê dados reais. Na execução fora do sandbox, arquivos, manifesto, migrações, Node, npm, wrangler e Git passaram; HEAD `f86ecd05007ccf11f611060e4a7293b2fe29b71f`, `origin/main 0 9`. Os avisos restantes são árvore suja desta etapa e variáveis remotas ausentes.

`.icbai/artifacts/REMOTE_G13_RUNBOOK.md` foi criado para a próxima etapa remota. Ele define sequência, critérios de parada, evidências obrigatórias e estados finais possíveis do G13. O runbook não autoriza ações remotas; serve para evitar validação improvisada quando credenciais e autorização existirem.

`.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md` foi criado como template de coleta de evidências sem segredos, PII ou dumps. `.env.example` agora lista as variáveis vazias necessárias para a etapa remota (`CF_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `LIMPAX_REMOTE_ENV`, `LIMPAX_RELEASE_OPERATOR`, `LIMPAX_ROLLBACK_PLAN_CONFIRMED`) sem valores reais.

`npm run qa:remote-evidence` foi acrescentado para varrer o template/evidência remota contra padrões óbvios de token, chave privada, e-mail, CPF, CNPJ e dump SQL antes de versionar ou compartilhar. É uma proteção inicial; revisão humana segue obrigatória.

Consulta de leitura posterior à hospedagem Sites identificou o commit publicado `98c0bbf3590536b9b078f5ae0611302ae5fd8393` (versão 3, status `succeeded`), 11 commits atrás do HEAD local naquele instante. O overview D1 remoto `DB` mostrou oito tabelas: `attachments`, `crm_tasks`, `events`, `lead_activities`, `leads`, `outbox`, `rate_limits` e `service_records`. Nenhuma linha de cliente foi lida. Migrações aplicadas, integridade e recuperação remotas continuam não verificadas.

## Fase atual

`EXISTING PROJECT → AUDIT & RESUME`. O núcleo A01–A08 está implementado localmente. O gate ativo é **G13 / Release Gate**, ainda reprovado. Não há autorização de deploy, migração remota ou uso de dados reais.

## Última tarefa concluída

Handoff multiagente e auditoria reconciliados. Foram confirmados:

- 47/47 testes nas oito suítes existentes;
- TypeScript aprovado;
- build de produção aprovado;
- lint global aprovado com zero erros e zero avisos; `.sites-runtime/**` é ignorado por ser artefato gerado;
- migrações D1 0000–0005 presentes; 0003–0005 sem aplicação remota comprovada;
- CRM local possui acesso/papéis, clientes, contatos, locais, leads, tarefas, notas, vínculos, review/live/archive, auditoria e idempotência;
- importador, comercial completo, contratos, agenda/OS, financeiro, fiscal e integrações Google ainda não estão implementados.

## Próxima tarefa única

Continuar o G13 em pequenas etapas verificáveis. Localmente, ampliar evidência de navegador/dispositivo quando necessário. Externamente, executar a etapa remota do G13 seguindo `.icbai/artifacts/REMOTE_G13_RUNBOOK.md` e preenchendo `.icbai/artifacts/REMOTE_G13_EVIDENCE_TEMPLATE.md`: rodar `npm run qa:remote-readiness` e `npm run qa:remote-evidence`, depois validar migrações, recuperação, configuração, Core Web Vitals e rollback com autorização específica. Não iniciar Supabase ou deploy sem ambiente e credenciais confirmados.

## Decisões recentes

- Supabase é a arquitetura alvo para PostgreSQL, Auth/Google, RLS e Storage privado.
- A migração será posterior ao fechamento da base G13, incremental e reversível. D1/R2 permanecem intactos até cutover aprovado.
- O plano gratuito do Supabase é aceitável para desenvolvimento/homologação e avaliação inicial. Produção precisa reavaliar pausa por inatividade, ausência de backup automático, capacidade e suporte.
- A empresa possui domínio próprio; domínio exato, DNS e subdomínios continuam `[VALIDAR]`.
- A futura navegação do CRM usará sidebar compacta com itens por permissão e identidade Limpax.
- Google Login é prioritário após a migração; Calendar começa CRM → Google; Drive recebe cópias; Sheets apoia importação; Maps/Routes e Gmail entram por fases.
- Life360 é o processo atual conhecido para frota. Rastreamento próprio será planejado com finalidade, consentimento, retenção e segurança.

## Bloqueios

- Contraste e tempo de resposta possuem evidência local limitada; Core Web Vitals, imagens/gradientes, estados fora do viewport e cobertura cruzada de navegador ainda não têm evidência final.
- Backup/restauração local aprovado; upgrade e recuperação remotos ainda não ensaiados.
- Migrações e configuração remotas não verificadas.
- Dados oficiais, domínio exato, contas Google, política de retenção, planilhas, modelo contratual e emissor fiscal permanecem `[VALIDAR]`.

## Retomada

1. Leia `AGENTS.md`.
2. Leia `.icbai/PROJECT_STATE.json`.
3. Leia este arquivo.
4. Leia `docs/CURRENT_TASK.md`.
5. Confira `git status` e preserve qualquer alteração posterior a este handoff.
6. Leia apenas o código da tarefa e preserve alterações alheias.

Arquivos-chave: `.icbai/artifacts/RELEASE_MATRIX.md`, `.icbai/artifacts/QUALITY_GATE_PROGRESS.md`, `docs/ROADMAP.md`, `docs/SUPABASE_MIGRATION_PLAN.md`, `db/schema.ts`, `drizzle/`, `lib/crm.ts`, `lib/crm-customers.ts`, `components/crm-workspace.tsx` e `components/customer-workspace.tsx`.
