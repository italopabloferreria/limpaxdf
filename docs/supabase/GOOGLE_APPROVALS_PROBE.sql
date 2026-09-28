-- S01 post-migration probe for project lkamarbpjqlibxlmcico.
-- Execute only with specific approval. Synthetic email only; ROLLBACK removes it.
-- Preconditions: owner is the only Auth user and CRM profile; no approvals.

begin;

do $preflight$
begin
  if (select count(*) from auth.users) <> 1
     or (select count(*) from public.crm_user_profiles) <> 1
     or (select count(*) from public.crm_user_profiles where is_super_admin) <> 1
     or (select count(*) from public.crm_google_approvals) <> 0 then
    raise exception 'S01 approval probe preflight changed';
  end if;
  if public.crm_before_user_created(jsonb_build_object('user', jsonb_build_object(
    'email', 'homologation-approval@example.invalid',
    'app_metadata', jsonb_build_object('provider', 'google')
  )))->'error'->>'http_code' <> '403' then
    raise exception 'Unapproved Google email was not blocked';
  end if;
end
$preflight$;

do $claims$
begin
  perform set_config('request.jwt.claim.sub',
    (select user_id::text from public.crm_user_profiles where is_super_admin), true);
end
$claims$;
set local role authenticated;

insert into public.crm_google_approvals (email, role)
values ('homologation-approval@example.invalid', 'attendant');

insert into public.crm_google_approvals (email, role)
values ('homologation-admin@example.invalid', 'admin');

do $owner$
begin
  if (select count(*) from public.crm_google_approvals
      where email = 'homologation-approval@example.invalid'
        and active and approved_by = (select auth.uid())) <> 1 then
    raise exception 'Owner could not approve a synthetic attendant';
  end if;
  if (select count(*) from public.crm_google_approvals
      where email = 'homologation-admin@example.invalid'
        and role = 'admin' and active
        and approved_by = (select auth.uid())) <> 1 then
    raise exception 'Owner could not approve a synthetic administrator';
  end if;
end
$owner$;

reset role;

-- Supabase SQL Editor can assume authenticated but not its internal
-- supabase_auth_admin role. Function behavior is checked here as postgres;
-- the Auth runtime grant is checked separately and the real hook must be
-- verified after Dashboard activation.

do $hook$
begin
  if public.crm_before_user_created(jsonb_build_object('user', jsonb_build_object(
    'email', 'homologation-approval@example.invalid',
    'app_metadata', jsonb_build_object('provider', 'google')
  ))) <> '{}'::jsonb then
    raise exception 'Approved Google email was not accepted by hook function';
  end if;
  if public.crm_before_user_created(jsonb_build_object('user', jsonb_build_object(
    'email', 'homologation-admin@example.invalid',
    'app_metadata', jsonb_build_object('provider', 'email')
  )))->'error'->>'http_code' <> '403' then
    raise exception 'Non-Google provider was not blocked';
  end if;
end
$hook$;

rollback;

-- Afterwards, a separate read-only query must return 0 approvals and 1 profile.
