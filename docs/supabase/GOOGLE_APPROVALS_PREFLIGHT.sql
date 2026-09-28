-- S01 read-only preflight; returns counts/booleans, never identity data.
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.crm_user_profiles) as crm_profiles,
  (select count(*) from public.crm_user_profiles
   where role = 'admin' and active and is_super_admin
     and user_id in (select id from auth.users)) as bound_active_superadmins,
  (select count(*) from public.leads) as leads,
  to_regclass('public.crm_google_approvals') is not null as approvals_table_exists,
  to_regprocedure('public.crm_before_user_created(jsonb)') is not null as approval_hook_function_exists,
  exists (
    select 1 from pg_trigger
    where tgname in ('crm_bind_approved_google_user',
                     'crm_sync_google_approval_profile',
                     'crm_google_approval_audit')
      and not tgisinternal
  ) as approval_trigger_exists;
