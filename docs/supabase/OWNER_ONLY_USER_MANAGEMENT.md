# Gestão de usuários exclusiva do proprietário

Decisão de 29/09/2026: somente o perfil ativo marcado como `is_super_admin` cadastra ou altera usuários. A conta atual do proprietário é `italopablo01@gmail.com`. Não criar outras contas durante esta etapa.

## Aplicação controlada

Projeto alvo: `lkamarbpjqlibxlmcico`. Antes de executar, confirmar no SQL Editor que `crm_google_approvals` e `crm_user_profiles` estão com RLS ativo, que existe exatamente um perfil ativo com `is_super_admin=true` vinculado a `auth.users`, e guardar o resultado de `pg_policies` para os seis nomes abaixo. Comparar essas expressões às migrações `20260928055505` e `20260928050106`. Se divergirem, parar e reconciliar; não usar `supabase db push`, pois o histórico da CLI não está conciliado.

Executar o conteúdo de `supabase/migrations/20260929220000_owner_only_crm_user_management.sql` primeiro em transação com o `commit` final substituído por `rollback`. Consultar `pg_policies` *dentro* dessa transação para confirmar que as seis policies apontam ao superadministrador. Confirmar depois do `rollback` que as expressões antigas voltaram. Só aplicar a migração definitiva com autorização específica e preflight aprovado.

Após aplicar, confirmar que as seis policies estão restritas, que o único superadministrador continua ativo e que não houve alteração na quantidade de aprovações ou perfis. Testar no navegador o perfil de Ítalo e o cadastro sem gravar um novo usuário. O teste negativo com um administrador comum exige uma conta real criada pelo proprietário; a ausência dela deve constar como limitação, nunca como PASS.

## Rollback se o proprietário perder gestão

Parar novas alterações de usuários. Em transação, restaurar as seis expressões originais a partir das migrações `20260928055505_crm_google_approved_access.sql` e `20260928050106_restrict_crm_admin_management.sql`, comparadas ao snapshot do preflight; manter `crm_google_approvals_auth_lookup` e o hook de Auth intactos. Confirmar RLS ativo, grants inalterados, contagens de linhas inalteradas e acesso do proprietário. Registrar o rollback como nova migração incremental, sem editar migração aplicada.

Esta mudança restringe políticas e interface; não cria, desativa, importa nem convida ninguém. D1/R2 permanecem intactos.
