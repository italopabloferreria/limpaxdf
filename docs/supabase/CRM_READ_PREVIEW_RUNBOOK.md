# Consulta protegida do CRM na prévia Vercel

Atualização de 29/09/2026: o grant `20260928210000_crm_preview_read_grants.sql` foi aplicado no SQL Editor após confirmação do proprietário. Postflight confirmou RLS nas quatro tabelas, `anon` sem SELECT, `authenticated` com SELECT e sem escrita nas quatro; 0 dados operacionais e 1 superadministrador ativo vinculado. O Data API anônimo retornou `42501`. `CRM_READ_RLS_PROBE.sql` passou com claim simulada de proprietário e negação sem perfil, terminando em `ROLLBACK` e 0 registros. Não substitui a matriz com JWT Google real de outra identidade. A Vercel Preview continua `SUPABASE_DATA_MODE=disabled`; não repetir o grant nem executar `db push` para reconciliar histórico da CLI.

Escopo: habilitar somente leitura de atendimentos e clientes com Google/Supabase na branch `codex/vercel-preview`. Não habilita escrita, importação, captação ou produção. D1/R2 continuam intactos.

## Preflight observado em 28/09/2026

- Projeto Supabase `lkamarbpjqlibxlmcico`, ambiente principal: 0 leads, 0 clientes, 0 contatos, 0 locais e 1 perfil de proprietário ativo, vinculado e superadministrador.
- RLS ativo em `leads`, `customers`, `customer_contacts` e `service_locations`.
- `anon` não tem SELECT em nenhuma das quatro tabelas. `authenticated` tem apenas SELECT em `leads`; não tem qualquer privilégio em clientes, contatos ou locais.
- As políticas SELECT das três tabelas de clientes restringem `authenticated` por `app_private.is_crm_member()`, que exige perfil ativo vinculado ao UUID da sessão.
- Login Google real do proprietário na URL HTTPS exata da branch Vercel retornou Superadministrador. A prévia de `f921234` está Ready. `SUPABASE_DATA_MODE` permanece `disabled`.

## Aplicação controlada

1. **Concluído em 29/09:** após confirmação específica, `supabase/migrations/20260928210000_crm_preview_read_grants.sql` foi aplicada no SQL Editor como uma transação. Não usar `db push`: o histórico da CLI ainda não foi reconciliado.
2. **Concluído em 29/09:** `has_table_privilege` e RLS auditados: `authenticated` tem somente SELECT nas quatro tabelas; `anon` continua sem SELECT. Contagens operacionais 0/0/0/0, sem alteração de dados.
3. **Parcial:** claim simulada do proprietário leu as três linhas sintéticas e claim sem perfil não leu; `ROLLBACK` confirmado. Ainda falta prova de JWT real com outra identidade sem perfil/inativa e leitura das listas pelo proprietário. A prova SQL com `SET ROLE` não substitui essa matriz. Antes de cadastrar qualquer outra pessoa, obter autorização para o cadastro e inclusão na audiência de teste Google.
4. Só depois, definir `SUPABASE_DATA_MODE=read_only` **apenas** no ambiente Preview do projeto Vercel `limpaxdf` e gerar nova prévia. Confirmar `/crm`, `/crm/clientes`, ausência de escrita nos `/api/crm/*` e status de login/logout. Production e `main` permanecem fora do escopo.

## Reversão

Primeiro voltar `SUPABASE_DATA_MODE=disabled` em Preview e publicar nova prévia. Como o preflight registrou ausência de privilégios nas três tabelas, a reversão exata desta migração é:

```sql
begin;
revoke select on table public.customers,
  public.customer_contacts, public.service_locations from authenticated;
commit;
```

Verificar que `authenticated` voltou a não ter SELECT nessas três tabelas e que a sessão do proprietário ainda funciona na homologação. Não alterar o SELECT preexistente em `leads`. Registrar a execução remota no estado do projeto.
