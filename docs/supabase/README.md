# Supabase — estado de homologação

O projeto `lkamarbpjqlibxlmcico` existe em São Paulo. A baseline em `supabase/migrations/202609230001_limpax_crm_baseline.sql` foi registrada como aplicada em 23/09/2026: 14 tabelas com RLS e cinco buckets privados. O CRM operacional continua em D1/R2. Não reaplicar nem editar essa migration.

## Arquivos

- `../../supabase/migrations/202609230001_limpax_crm_baseline.sql`: substitui o rascunho antigo removido; é a baseline preservada.
- `MAPPING_D1_TO_SUPABASE.md`: mapeamento entre D1/R2 atual e Supabase PostgreSQL/Storage.
- `EXECUTION_PLAN.md`: sequencia operacional para criar projeto, testar Auth Google, migrar dados sinteticos, validar backup/exportacao e planejar cutover.
- `AUTH_HOMOLOGATION_DESIGN.md`: fluxo Google, sessão e matriz de permissão.
- `BOUND_USER_RLS_RUNBOOK.md`: migração local pendente que exige vínculo de perfil pelo UUID, com preflight e validação.
- `AUTH_RLS_READINESS.sql`: consultas de revisão; não é uma nova migration.
- `../AI_HANDOFF.md` e `../CURRENT_TASK.md`: estado e tarefa atuais.

`/supabase/homologacao` contém o fluxo local isolado. Em 25/09/2026, Google OAuth ficou em modo de testes no projeto `limpax-c54d6`, com o callback do Supabase e o retorno local cadastrados. O provedor Google está ativo no projeto Supabase; a conta do proprietário consta como usuária de teste. A flag local `SUPABASE_GOOGLE_ENABLED=true` habilita o botão. No navegador, login real retornou `no_profile` e logout voltou a `signed_out`, inclusive após recarregar. A matriz completa de perfis/RLS ainda não passou; manter `SUPABASE_DATA_MODE=disabled`.

## Fontes oficiais consultadas

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google

## Regras

- Não reaplicar a baseline nem executar SQL remoto sem tarefa autorizada.
- Nao copiar dados reais para este diretorio.
- Nao salvar `service_role`, URL secreta, tokens Google ou credenciais Cloudflare/Supabase.
- Mudanças futuras usam migrations incrementais, teste de regressão e rollback.
- Toda tabela exposta precisa de RLS antes de qualquer uso por cliente autenticado.
- `service_role` fica somente no servidor e em tarefas administrativas controladas.
- Buckets de CRM, contratos, importacoes e backups devem ser privados.
- A autorizacao de administrador deve usar tabela propria (`crm_user_profiles`), nao metadados editaveis do usuario.
