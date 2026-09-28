-- S01: bootstrap permanente do único superadministrador Supabase.
-- NÃO executar sem confirmação na hora da ação. Projeto lkamarbpjqlibxlmcico.
-- Pré-requisito: aplicar e verificar a migration
-- 20260928050106_restrict_crm_admin_management.sql.
-- Isto concede acesso administrativo ao CRM de homologação à conta indicada.

begin;

do $bootstrap$
declare
  owner_id uuid;
  owner_email text;
  timestamp_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
begin
  if (select count(*) from auth.users) <> 1
     or (select count(*) from public.crm_user_profiles) <> 0 then
    raise exception 'S01 bootstrap preflight changed; inspect Auth and profiles';
  end if;

  select id, lower(email) into owner_id, owner_email
  from auth.users where lower(email) = 'italopablo01@gmail.com';
  if owner_id is null then
    raise exception 'S01 owner Auth identity not found';
  end if;

  insert into public.crm_user_profiles
    (email, user_id, display_name, role, active,
     is_super_admin, created_at, updated_at)
  values
    (owner_email, owner_id, 'Ítalo', 'admin', true,
     true, timestamp_ms, timestamp_ms);
end
$bootstrap$;

commit;

-- Após a execução, verificar apenas flags, sem expor UUID ou e-mail:
-- select count(*) = 1 as one_super_admin,
--        bool_and(active and role = 'admin' and user_id is not null)
--          as owner_profile_valid
-- from public.crm_user_profiles where is_super_admin;
-- Depois confirmar login Google real como superadministrador.
