# LIMPAX — handoff atual

Atualizado em 28/09/2026. Pasta oficial: `C:/Users/italo/Programação/Limpax`.

## Tarefa desta sessão

A revisão geral, limpeza e correções foram entregues ao GitHub no commit `3f3e410`. A tarefa ativa é S01 de homologação Supabase Auth/RLS; ver `docs/CURRENT_TASK.md`. A cópia `01_PROJETOS/LIMPAX` permanece preservada; não alternar edições entre pastas.

## Estado operacional

Revisão AUDIT-CLEANUP-01 concluída: 78 testes/cenários, TypeScript, lint global, build e cinco rotas HTTP/CSP passaram. Dependências de produção têm zero avisos; quatro moderados persistem apenas na cadeia drizzle-kit/esbuild de desenvolvimento. O relatório detalha a limpeza e as correções. O commit `3f3e410` foi enviado para `origin/main`, sem deploy.

- Site e CRM usam React/TypeScript, Vinext/Cloudflare, D1/Drizzle e R2. Identidade do CRM vem do hosting Sites e autorização de perfis D1.
- CRM local possui clientes, contatos, locais, atendimentos, tarefas, notas, vínculos, lifecycle, auditoria e idempotência. Comercial completo, importador, documentos, agenda/OS, frota, financeiro e fiscal seguem no roadmap.
- G13_RELEASE_GATE continua aberto: migrações/recuperação remotas, configuração e desempenho em produção não têm aceite. Commit no GitHub não é deploy.
- As seis migrações D1 foram preservadas; não reaplicar migrações existentes. Fontes de mídia, licenças e configuração de hosting continuam necessárias.

## Supabase: o que já existe

Projeto `lkamarbpjqlibxlmcico`, São Paulo `sa-east-1`. Baseline `supabase/migrations/202609230001_limpax_crm_baseline.sql` registrada como aplicada em 23/09/2026: 14 tabelas com RLS, 50 policies e cinco buckets privados. Grants SELECT em leads/perfis foram aplicados com autorização específica. A revisão atual não executou SQL remoto nem revalidou a baseline no servidor.

Adapter de leitura e ponte JWT existem, mas `SUPABASE_DATA_MODE` permanece `disabled`. O caminho de homologação `/supabase/homologacao` usa Google PKCE, callback, cookies de `@supabase/ssr`, validação `auth.getUser` e perfil ativo pelo UUID. Cookies SSR são acessíveis a JavaScript; `SameSite=Lax`, `Secure` em HTTPS. A integração ainda é isolada do CRM operacional.

Google Provider está ativado no Supabase. No projeto Google Cloud `limpax-c54d6`, o app `Limpax CRM Homologação` e o cliente web estão em modo de testes com callback Supabase configurado; a conta do proprietário é usuária de teste. O e-mail de suporte foi escolhido pelo usuário e o Client ID/secret foram armazenados apenas no provedor Google do Supabase. O retorno local exato está cadastrado no Supabase. `SUPABASE_GOOGLE_ENABLED=true` na `.env.local` ignorada pelo Git. Em 25/09/2026, o navegador concluiu login real e retornou `no_profile`; logout retornou `signed_out`, inclusive após recarregar. A primeira tentativa falhou porque o processo de desenvolvimento estava sem rede; executado com acesso de rede, o callback passou.

## Retomada OAuth após a revisão

Callbacks configurados: Google → `https://lkamarbpjqlibxlmcico.supabase.co/auth/v1/callback`; Supabase → `http://localhost:5173/api/supabase/homologation/callback`. Login/logout e negação por perfil ausente passaram no navegador. A migração `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` foi aplicada via SQL Editor em 25/09/2026 após autorização específica: funções e política de perfis agora exigem UUID, sem fallback por e-mail. Ver `docs/supabase/BOUND_USER_RLS_RUNBOOK.md` para preflight, resultado e limitações. O painel da CLI ainda não registra a baseline nem esta migração. Perfis continuam 0; antes de criar perfis/fixtures, obter autorização específica conforme `AGENTS.md`. Não usar service_role como sessão.

O verificador remoto exige JWT de usuário, `LIMPAX_SUPABASE_REMOTE_VALIDATION=authorized` e lote `SUPABASE_HOMOLOGATION_BATCH=homologation-...`. Sem isso, só dry-run. Um PASS do script não substitui a matriz OAuth/RLS, Storage e recuperação. Dados reais e cutover dependem de backup, reconciliação, rollback e autorização específica.

Em 28/09, leitura remota confirmou 1 usuário Auth, 0 perfis CRM e 0 leads; `authenticated` possui SELECT em leads/perfis, mas não INSERT em leads. Uma transação no SQL Editor com papel `authenticated` e claim do usuário existente leu 0/0, resultado inconclusivo para negação de lead porque a tabela está vazia. O teste com lead sintético e `ROLLBACK` está preparado em `docs/supabase/RLS_NEGATIVE_PROBE.sql`, ainda sem execução/autorização específica. Readiness e dry-run locais passaram. Papel de teste do proprietário foi solicitado; nenhuma permissão CRM foi concedida.

Regra nova do proprietário: Ítalo é superadministrador único, somente ele pode criar/promover administradores; administradores comuns podem cadastrar atendentes. A API operacional Sites/D1 agora aplica essa separação e `/crm/perfil` permite cadastrar membros com a opção de administrador somente para o superadministrador. `CRM_SUPER_ADMIN_EMAIL` foi configurado apenas na `.env.local` ignorada; produção requer configuração no hosting antes de usar a tela. A migration incremental de policies Supabase e `docs/supabase/SUPER_ADMIN_BOOTSTRAP.sql` foram preparados localmente, sem aplicação remota ou concessão de acesso. Consulta remota adicional confirmou perfil com apenas SELECT para `authenticated` e 0 perfis. O teste negativo com 0 perfis deve preceder o bootstrap. Os testes de acesso passaram 18/18, os gerais 16/16, TypeScript, lint e build passaram. O navegador local mostrou a página de perfil da conta de teste Sites como administrador comum.

## Fontes de continuidade

Leia `.icbai/PROJECT_STATE.json`, este handoff e `docs/CURRENT_TASK.md`, depois o código afetado. O histórico detalhado das sessões permanece no Git e nos relatórios `.icbai/artifacts/`; informações históricas não substituem este estado. Para o desenho atual, consulte `docs/supabase/AUTH_HOMOLOGATION_DESIGN.md` e `docs/ROADMAP.md`.
