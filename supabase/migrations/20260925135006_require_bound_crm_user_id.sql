-- Authorization must follow the Supabase Auth UUID, never an email claim.
-- This intentionally leaves unbound legacy profiles unable to authorize CRM access.
-- Apply only after the remote baseline has been verified and this change approved.

begin;

create or replace function app_private.is_crm_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.crm_user_profiles p
    where p.active = true
      and p.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.is_crm_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.crm_user_profiles p
    where p.active = true
      and p.role = 'admin'::public.crm_role
      and p.user_id = (select auth.uid())
  );
$$;

alter policy crm_user_profiles_read_own_or_admin
on public.crm_user_profiles
using (user_id = (select auth.uid()) or app_private.is_crm_admin());

-- No active policy or helper needs the email-based lookup after the changes above.
drop function app_private.current_crm_email();

commit;
