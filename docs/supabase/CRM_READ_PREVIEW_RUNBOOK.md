# Consulta protegida do CRM na prévia Vercel

Escopo: habilitar somente leitura de atendimentos e clientes com Google/Supabase na branch `codex/vercel-preview`. Não habilita escrita, importação, captação ou produção. D1/R2 continuam intactos.

## Preflight observado em 28/09/2026

- Projeto Supabase `lkamarbpjqlibxlmcico`, ambiente principal: 0 leads, 0 clientes, 0 contatos, 0 locais e 1 perfil de proprietário ativo, vinculado e superadministrador.
- RLS ativo em `leads`, `customers`, `customer_contacts` e `service_locations`.
- `anon` não tem SELECT em nenhuma das quatro tabelas. `authenticated` tem apenas SELECT em `leads`; não tem qualquer privilégio em clientes, contatos ou locais.
- As políticas SELECT das três tabelas de clientes restringem `authenticated` por `app_private.is_crm_member()`, que exige perfil ativo vinculado ao UUID da sessão.
- Login Google real do proprietário na URL HTTPS exata da branch Vercel retornou Superadministrador. A prévia de `f921234` está Ready. `SUPABASE_DATA_MODE` permanece `disabled`.

## Aplicação controlada

1. Após autorização específica do proprietário, aplicar `supabase/migrations/20260928210000_crm_preview_read_grants.sql` no SQL Editor como uma transação. Não usar `db push`: o histórico da CLI ainda não foi reconciliado com as migrações já aplicadas pelo SQL Editor.
2. Conferir novamente `has_table_privilege` e RLS: `authenticated` deve ter somente SELECT nas quatro tabelas; `anon` deve continuar sem SELECT. Confirmar contagens e ausência de alteração de dados.
3. Fazer prova de JWT real: proprietário lê listas vazias; sessão sem perfil ou inativa não lê. A prova SQL com `SET ROLE` anterior não substitui essa matriz. Antes de cadastrar qualquer outra pessoa, obter autorização para o cadastro e inclusão na audiência de teste Google.
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
