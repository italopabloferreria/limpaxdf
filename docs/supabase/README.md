# Supabase — estado de homologação

O projeto `lkamarbpjqlibxlmcico` existe em São Paulo. A baseline em `supabase/migrations/202609230001_limpax_crm_baseline.sql` foi registrada como aplicada em 23/09/2026: 14 tabelas com RLS e cinco buckets privados. O CRM operacional continua em D1/R2. Não reaplicar nem editar essa migration.

## Arquivos

- `../../supabase/migrations/202609230001_limpax_crm_baseline.sql`: substitui o rascunho antigo removido; é a baseline preservada.
- `MAPPING_D1_TO_SUPABASE.md`: mapeamento entre D1/R2 atual e Supabase PostgreSQL/Storage.
- `EXECUTION_PLAN.md`: sequencia operacional para criar projeto, testar Auth Google, migrar dados sinteticos, validar backup/exportacao e planejar cutover.
- `AUTH_HOMOLOGATION_DESIGN.md`: fluxo Google, sessão e matriz de permissão.
- `BOUND_USER_RLS_RUNBOOK.md`: aplicação e evidência da migração incremental que exige vínculo de perfil pelo UUID.
- `RLS_NEGATIVE_PROBE.sql`: teste transacional executado em 28/09/2026; o lead sintético foi negado ao papel autenticado sem perfil e removido por `ROLLBACK`.
- `../../supabase/migrations/20260928050106_restrict_crm_admin_management.sql`: hierarquia aplicada em 28/09/2026; não habilita escrita via Data API.
- `SUPER_ADMIN_BOOTSTRAP.sql`: bootstrap executado em 28/09/2026 para vincular a única conta superadministradora ao UUID Auth.
- `AUTH_RLS_READINESS.sql`: consultas de revisão; não é uma nova migration.
- `../AI_HANDOFF.md` e `../CURRENT_TASK.md`: estado e tarefa atuais.

`/supabase/homologacao` contém o fluxo local isolado. Em 25/09/2026, Google OAuth ficou em modo de testes no projeto `limpax-c54d6`, com callbacks cadastrados. O provedor Google está ativo; a conta do proprietário consta como usuária de teste. Em 28/09/2026, o teste negativo de RLS passou com `ROLLBACK`, a hierarquia foi aplicada e o único perfil superadministrador foi vinculado ao UUID Auth. O navegador mostrou `Papel: Superadministrador` após login Google real e recarga. Os testes de atendente/admin comum, Storage e leads sintéticos positivos seguem pendentes; manter `SUPABASE_DATA_MODE=disabled`.

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
