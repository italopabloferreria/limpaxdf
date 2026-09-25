# S01 — autorização Supabase vinculada ao UUID

Estado em 25/09/2026: migração aplicada no projeto `lkamarbpjqlibxlmcico` via SQL Editor, como transação única, após autorização específica do usuário. O editor retornou `Success. No rows returned`. CRM operacional permanece D1/R2 e `SUPABASE_DATA_MODE=disabled`. Antes da aplicação, o SQL Editor confirmou as definições antigas contra a baseline versionada, 0 perfis, grants SELECT e RLS ativos em `leads` e `crm_user_profiles`. O plano Free não fornece backups automáticos. A baseline e esta mudança foram executadas pelo SQL Editor; o painel de migrações da CLI permanece sem histórico reconciliado.

## Problema e alteração

A baseline aplicada permitia que um JWT Google com e-mail igual ao de um perfil ativo fosse tratado como membro/admin mesmo quando `crm_user_profiles.user_id` não correspondia ao usuário autenticado. Isso diferia da checagem da interface, que exige UUID. A migração incremental `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` faz `is_crm_member`, `is_crm_admin` e a política de leitura de perfis dependerem do UUID de `auth.uid()`; elimina a função de comparação por e-mail. Não modifica dados. Perfis com `user_id` nulo ficam sem acesso até vínculo administrativo controlado.

## Preflight executado

1. Confirmar no Dashboard o projeto `lkamarbpjqlibxlmcico`. O preflight confirmou grants SELECT, RLS ativo, definições completas dos três objetos contra a baseline versionada e 0 perfis. Se houver alteração desde então, parar e revisar.
2. Usar as definições verificadas da baseline versionada como snapshot de reversão desses objetos. O plano Free não oferece backups automáticos, mas esta mudança não modifica dados e a tabela de perfis está vazia. Backup/restauração integral segue como gate separado antes de migração de dados ou corte do CRM.
3. O usuário pediu implementar após receber a proposta concreta. O arquivo versionado foi executado como uma transação única no SQL Editor, sem comandos isolados adicionais.
4. Registrar método de aplicação e histórico de migrações remoto. O painel de migrações está vazio porque a baseline foi executada pelo SQL Editor; não usar `supabase db push` antes de reconciliar esse histórico, pois ele tentaria reaplicar a baseline.

## Verificação após aplicação

O SQL Editor confirmou: `is_crm_member` e `is_crm_admin` sem referência a `p.email`; a política `crm_user_profiles_read_own_or_admin` contém `user_id = auth.uid()` ou admin; `current_crm_email()` não existe; perfis continuam 0; RLS em perfis continua ativo. No navegador, o login Google real retornou `no_profile` e o logout voltou a `signed_out`. `npm run qa:supabase-session` passou 6/6 fora do sandbox; readiness e dry-run também passaram. Não houve criação de perfil, fixture ou importação.

- Confirmado: `pg_get_functiondef` das duas funções e `pg_policies.qual` de `crm_user_profiles_read_own_or_admin` não contêm fallback por e-mail; a interface mostrou `no_profile` após novo login Google.
- Ainda pendente: testar SELECT em `crm_user_profiles` e contagem em `leads` com JWT de usuário sem perfil e depois com perfis/fixtures sintéticas. Uma consulta como dono do banco não prova a RLS completa.
- Só depois de confirmar a negação, definir com o proprietário quais UUIDs serão administradores/atendentes. Criar perfis e fixtures sintéticas em etapa autorizada separada; testar usuários inativos e papéis ativo admin/atendente, inclusive Storage privado.
- Conferir que `SUPABASE_DATA_MODE=disabled` e que D1/R2 continuam operacionais. Não concluir G13 por esta mudança isolada.

## Parada e reversão

Se a definição remota divergir, o backup falhar, a aplicação falhar ou a negação não passar, parar e manter o adapter desativado. A transação da migração evita estado parcialmente aplicado. O rollback técnico é restaurar, em nova transação, as definições anteriores registradas no backup e a política original. Isso reintroduz autorização por e-mail; usar apenas se houver necessidade operacional validada, com nova revisão de segurança. Como o CRM em uso permanece em D1/R2, o caminho preferido na homologação é corrigir a nova migração antes de prosseguir.
