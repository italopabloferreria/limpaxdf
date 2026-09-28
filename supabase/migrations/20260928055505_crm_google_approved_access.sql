-- S01: Google OAuth is allowed only for active, administratively approved email.
-- Existing CRM profiles and D1/R2 are not modified by this migration.
-- Enable the Before User Created hook in Auth > Hooks only after applying and
-- verifying this migration. Function: public.crm_before_user_created.

begin;

create table public.crm_google_approvals (
  email text primary key,
  display_name text,
  role public.crm_role not null,
  active boolean not null default true,
  approved_by uuid not null default auth.uid() references auth.users(id),
  created_at bigint not null default (floor(extract(epoch from now()) * 1000)::bigint),
  updated_at bigint not null default (floor(extract(epoch from now()) * 1000)::bigint),
  constraint crm_google_approvals_email_normalized check (
    email = lower(btrim(email)) and char_length(email) between 3 and 200
    and position('@' in email) > 1
  ),
  constraint crm_google_approvals_name_length check (
    display_name is null or char_length(display_name) <= 180
  )
);

create index crm_google_approvals_role_active
  on public.crm_google_approvals (role, active);

alter table public.crm_google_approvals enable row level security;
revoke all on table public.crm_google_approvals from public, anon, authenticated;
grant select, insert on table public.crm_google_approvals to authenticated;
grant update (display_name, role, active) on table public.crm_google_approvals to authenticated;
grant select on table public.crm_google_approvals to supabase_auth_admin;

create policy crm_google_approvals_admin_read
  on public.crm_google_approvals for select to authenticated
  using (
    app_private.is_crm_admin()
    and (role = 'attendant'::public.crm_role or app_private.is_crm_super_admin())
  );

create policy crm_google_approvals_admin_insert
  on public.crm_google_approvals for insert to authenticated
  with check (
    approved_by = (select auth.uid()) and active
    and (
      (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
      or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
    )
  );

create policy crm_google_approvals_admin_update
  on public.crm_google_approvals for update to authenticated
  using (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  )
  with check (
    (role = 'attendant'::public.crm_role and app_private.is_crm_admin())
    or (role = 'admin'::public.crm_role and app_private.is_crm_super_admin())
  );

create policy crm_google_approvals_auth_lookup
  on public.crm_google_approvals for select to supabase_auth_admin
  using (true);

create function app_private.touch_crm_google_approval()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_at := floor(extract(epoch from now()) * 1000)::bigint;
  return new;
end;
$$;

revoke all on function app_private.touch_crm_google_approval() from public, anon, authenticated;
create trigger crm_google_approval_touch
  before update on public.crm_google_approvals
  for each row execute function app_private.touch_crm_google_approval();

-- The Auth hook itself runs as supabase_auth_admin, never as an API client.
create function public.crm_before_user_created(event jsonb)
returns jsonb language plpgsql security invoker
set search_path = ''
as $$
declare
  incoming_email text := lower(btrim(coalesce(event->'user'->>'email', '')));
  incoming_provider text := lower(coalesce(event->'user'->'app_metadata'->>'provider', ''));
begin
  if incoming_provider = 'google' and exists (
    select 1 from public.crm_google_approvals approval
    where approval.email = incoming_email and approval.active
  ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403, 'message', 'Usuário não registrado.'
  ));
end;
$$;

revoke all on function public.crm_before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.crm_before_user_created(jsonb) to supabase_auth_admin;

-- This trigger is a second, fail-closed guard if hook configuration is missing.
-- It also binds the newly created Auth UUID to the approved CRM role atomically.
create function app_private.bind_approved_google_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  approval public.crm_google_approvals%rowtype;
  normalized_email text := lower(btrim(coalesce(new.email, '')));
begin
  if lower(coalesce(new.raw_app_meta_data->>'provider', '')) <> 'google' then
    raise exception 'Google account approval required' using errcode = '28000';
  end if;
  select * into approval from public.crm_google_approvals
    where email = normalized_email and active for update;
  if not found then
    raise exception 'Google account approval required' using errcode = '28000';
  end if;
  insert into public.crm_user_profiles
    (email, user_id, display_name, role, active, is_super_admin,
     created_at, updated_at)
  values
    (approval.email, new.id, approval.display_name, approval.role, true, false,
     floor(extract(epoch from now()) * 1000)::bigint,
     floor(extract(epoch from now()) * 1000)::bigint);
  return new;
end;
$$;

revoke all on function app_private.bind_approved_google_user() from public, anon, authenticated;
create trigger crm_bind_approved_google_user
  after insert on auth.users
  for each row execute function app_private.bind_approved_google_user();

create function app_private.sync_google_approval_profile()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  update public.crm_user_profiles
  set display_name = new.display_name,
      role = new.role,
      active = new.active,
      updated_at = new.updated_at
  where email = new.email and not is_super_admin;
  return new;
end;
$$;

revoke all on function app_private.sync_google_approval_profile() from public, anon, authenticated;
create trigger crm_sync_google_approval_profile
  after update of display_name, role, active on public.crm_google_approvals
  for each row execute function app_private.sync_google_approval_profile();

create function app_private.audit_google_approval()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  actor_email text;
begin
  select email into actor_email from auth.users where id = (select auth.uid());
  insert into public.crm_audit_log
    (id, entity_type, entity_id, action, author, data, created_at)
  values
    (gen_random_uuid()::text, 'crm_google_approval', new.email,
     case when tg_op = 'INSERT' then 'approved' else 'approval_updated' end,
     coalesce(actor_email, 'unknown'),
     jsonb_build_object('role', new.role, 'active', new.active),
     floor(extract(epoch from now()) * 1000)::bigint);
  return new;
end;
$$;

revoke all on function app_private.audit_google_approval() from public, anon, authenticated;
create trigger crm_google_approval_audit
  after insert or update on public.crm_google_approvals
  for each row execute function app_private.audit_google_approval();

commit;
