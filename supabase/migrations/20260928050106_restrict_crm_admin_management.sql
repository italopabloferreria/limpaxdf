-- S01: one administratively bound superadmin may manage admin profiles.
-- No user or profile is created by this migration. Bootstrap is a separate,
-- explicitly authorized operation after the owner's Auth UUID is verified.
-- The operational CRM still uses D1/R2; this migration is not yet applied.

begin;

alter table public.crm_user_profiles
  add column is_super_admin boolean not null default false;

create unique index crm_one_super_admin
  on public.crm_user_profiles (is_super_admin)
  where is_super_admin;

create function app_private.is_crm_super_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.crm_user_profiles profile
    where profile.user_id = (select auth.uid())
      and profile.role = 'admin'::public.crm_role
      and profile.active = true
      and profile.is_super_admin = true
  );
$$;

revoke all on function app_private.is_crm_super_admin() from public, anon, authenticated;
grant execute on function app_private.is_crm_super_admin() to authenticated;

-- The current Data API profile access remains read-only. A future account
-- management endpoint must validate Auth identity and grant only needed columns.
revoke all on table public.crm_user_profiles from anon, authenticated;
grant select on table public.crm_user_profiles to authenticated;

alter policy crm_user_profiles_admin_insert on public.crm_user_profiles
with check (
  user_id is not null
  and not is_super_admin
  and (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  )
);

alter policy crm_user_profiles_admin_update on public.crm_user_profiles
using (
  not is_super_admin
  and (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  )
)
with check (
  user_id is not null
  and not is_super_admin
  and (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  )
);

alter policy crm_user_profiles_admin_delete on public.crm_user_profiles
using (
  not is_super_admin
  and (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  )
);

commit;
