# LIMPAX — handoff atual

Atualizado em 24/09/2026. Pasta oficial: `C:/Users/italo/Programação/Limpax`.

## Tarefa desta sessão

O usuário pediu revisão geral, remoção de legado sem uso, correção de erros e commit/push no GitHub antes de continuar Supabase. Ver `docs/CURRENT_TASK.md` e `docs/AUDIT_2026-09-24.md`. Alterações anteriores desta conversa estão incluídas na revisão. A cópia `01_PROJETOS/LIMPAX` permanece preservada; não alternar edições entre pastas.

## Estado operacional

Revisão AUDIT-CLEANUP-01 concluída localmente: 78 testes/cenários, TypeScript, lint global, build e cinco rotas HTTP/CSP passaram. Dependências de produção têm zero avisos; quatro moderados persistem apenas na cadeia drizzle-kit/esbuild de desenvolvimento. O relatório detalha a limpeza e as correções. A entrega de código é para `origin/main`, sem deploy; verificar o SHA e a sincronização no Git.

- Site e CRM usam React/TypeScript, Vinext/Cloudflare, D1/Drizzle e R2. Identidade do CRM vem do hosting Sites e autorização de perfis D1.
- CRM local possui clientes, contatos, locais, atendimentos, tarefas, notas, vínculos, lifecycle, auditoria e idempotência. Comercial completo, importador, documentos, agenda/OS, frota, financeiro e fiscal seguem no roadmap.
- G13_RELEASE_GATE continua aberto: migrações/recuperação remotas, configuração e desempenho em produção não têm aceite. Commit no GitHub não é deploy.
- As seis migrações D1 foram preservadas; não reaplicar migrações existentes. Fontes de mídia, licenças e configuração de hosting continuam necessárias.

## Supabase: o que já existe

Projeto `lkamarbpjqlibxlmcico`, São Paulo `sa-east-1`. Baseline `supabase/migrations/202609230001_limpax_crm_baseline.sql` registrada como aplicada em 23/09/2026: 14 tabelas com RLS, 50 policies e cinco buckets privados. Grants SELECT em leads/perfis foram aplicados com autorização específica. A revisão atual não executou SQL remoto nem revalidou a baseline no servidor.

Adapter de leitura e ponte JWT existem, mas `SUPABASE_DATA_MODE` permanece `disabled`. O caminho de homologação `/supabase/homologacao` usa Google PKCE, callback, cookies de `@supabase/ssr`, validação `auth.getUser` e perfil ativo pelo UUID. Cookies SSR são acessíveis a JavaScript; `SameSite=Lax`, `Secure` em HTTPS. A integração ainda é isolada do CRM operacional.

Google Provider está desativado. O projeto Google Cloud `limpax-c54d6` está com configuração OAuth incompleta. O erro `Unsupported provider: provider is not enabled` foi observado pelo usuário; não representa login concluído. A interface agora informa configuração pendente e bloqueia o botão enquanto `SUPABASE_GOOGLE_ENABLED` não for `true`.

## Retomada OAuth após a revisão

Configuração Google/Supabase, e-mail de suporte e identidades de teste ainda precisam de confirmação. Callback Google: `https://lkamarbpjqlibxlmcico.supabase.co/auth/v1/callback`. Retorno local: `http://localhost:5173/api/supabase/homologation/callback`. Não habilitar a flag local antes de verificar provedor/redirects. Validar login/logout e negações por perfil/RLS com dados sintéticos; não usar service_role como sessão.

O verificador remoto exige JWT de usuário, `LIMPAX_SUPABASE_REMOTE_VALIDATION=authorized` e lote `SUPABASE_HOMOLOGATION_BATCH=homologation-...`. Sem isso, só dry-run. Um PASS do script não substitui a matriz OAuth/RLS, Storage e recuperação. Dados reais e cutover dependem de backup, reconciliação, rollback e autorização específica.

## Fontes de continuidade

Leia `.icbai/PROJECT_STATE.json`, este handoff e `docs/CURRENT_TASK.md`, depois o código afetado. O histórico detalhado das sessões permanece no Git e nos relatórios `.icbai/artifacts/`; informações históricas não substituem este estado. Para o desenho atual, consulte `docs/supabase/AUTH_HOMOLOGATION_DESIGN.md` e `docs/ROADMAP.md`.
