# S01 — autorização Supabase vinculada ao UUID

Estado em 25/09/2026: preparado localmente, sem aplicação remota. Projeto alvo `lkamarbpjqlibxlmcico`; CRM operacional permanece D1/R2 e `SUPABASE_DATA_MODE=disabled`.

## Problema e alteração

A baseline aplicada permite que um JWT Google com e-mail igual ao de um perfil ativo seja tratado como membro/admin mesmo quando `crm_user_profiles.user_id` não corresponde ao usuário autenticado. Isso difere da checagem da interface, que exige UUID. A migração incremental `supabase/migrations/20260925135006_require_bound_crm_user_id.sql` faz `is_crm_member`, `is_crm_admin` e a política de leitura de perfis dependerem do UUID de `auth.uid()`; elimina a função de comparação por e-mail. Não modifica dados. Perfis com `user_id` nulo ficam sem acesso até vínculo administrativo controlado.

## Antes de aplicar remotamente

1. Confirmar no Dashboard o projeto `lkamarbpjqlibxlmcico` e que a baseline de 23/09/2026 e os grants SELECT foram aplicados. Conferir as definições atuais das duas funções e da política de perfis; se divergirem do arquivo versionado, parar e revisar.
2. Registrar um backup/exportação verificável do schema e dos perfis antes da mudança. Não anexar exportação nem identificadores pessoais ao Git.
3. Revisar o SQL da migração e obter autorização específica para aplicá-la remotamente. Aplicar como uma transação única; se qualquer comando falhar, não tentar continuar com comandos isolados.
4. Registrar método de aplicação e histórico de migrações remoto. A baseline foi executada pelo SQL Editor; não presumir que o registro da CLI foi preenchido.

## Verificação após aplicação

- Inspecionar `pg_get_functiondef` das duas funções e `pg_policies.qual` de `crm_user_profiles_read_own_or_admin`: apenas UUID/papel administrativo; nenhuma referência a `current_crm_email`.
- Repetir login Google da conta de teste sem perfil: a interface deve mostrar `no_profile`. Com o JWT desse usuário, SELECT em `crm_user_profiles` e contagem em `leads` devem retornar zero linhas. Uma consulta como dono do banco não prova a RLS.
- Só depois de confirmar a negação, definir com o proprietário quais UUIDs serão administradores/atendentes. Criar perfis e fixtures sintéticas em etapa autorizada separada; testar usuários inativos e papéis ativo admin/atendente, inclusive Storage privado.
- Conferir que `SUPABASE_DATA_MODE=disabled` e que D1/R2 continuam operacionais. Não concluir G13 por esta mudança isolada.

## Parada e reversão

Se a definição remota divergir, o backup falhar, a aplicação falhar ou a negação não passar, parar e manter o adapter desativado. A transação da migração evita estado parcialmente aplicado. O rollback técnico é restaurar, em nova transação, as definições anteriores registradas no backup e a política original. Isso reintroduz autorização por e-mail; usar apenas se houver necessidade operacional validada, com nova revisão de segurança. Como o CRM em uso permanece em D1/R2, o caminho preferido na homologação é corrigir a nova migração antes de prosseguir.
