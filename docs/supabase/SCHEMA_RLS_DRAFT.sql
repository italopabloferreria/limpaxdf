-- LIMPAX CRM — Supabase PostgreSQL/RLS draft
-- Status: documentation draft only. Do not run in production as-is.
-- Purpose: prepare the future Supabase migration from Cloudflare D1/R2 while preserving current production behavior.
-- Required before execution: generate real migrations, review with Supabase advisors, validate on an empty staging project, and record rollback evidence.

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

do $$ begin
  create type public.crm_role as enum ('admin', 'attendant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.customer_kind as enum ('pf', 'pj', 'condominio', 'orgao_publico', 'outro');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.capture_mode as enum ('review', 'live', 'archive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lead_status as enum (
    'novo',
    'em_contato',
    'qualificado',
    'orcamento',
    'agendado',
    'em_execucao',
    'concluido',
    'recorrencia',
    'cancelado'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.crm_user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role public.crm_role not null default 'attendant',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text,
  service_type text,
  origin text not null default 'manual',
  status public.lead_status not null default 'novo',
  capture_mode public.capture_mode not null default 'review',
  customer_id uuid,
  assigned_to uuid references public.crm_user_profiles(id) on delete set null,
  scheduled_for timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  kind public.customer_kind not null default 'pf',
  name text not null,
  legal_name text,
  tax_id text,
  phone text,
  email text,
  notes text,
  capture_mode public.capture_mode not null default 'review',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  add constraint leads_customer_fk foreign key (customer_id) references public.customers(id) on delete set null;

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  role_title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_locations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null,
  address text not null,
  city text,
  region text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_customer_links (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_by uuid references public.crm_user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (lead_id, customer_id)
);

create table if not exists public.outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  recipient text,
  subject text,
  body text,
  status text not null default 'pending',
  provider text,
  provider_ref text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  bucket text not null,
  object_path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  created_by uuid references public.crm_user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null,
  count integer not null default 0,
  reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, scope)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.crm_user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  service_type text,
  description text,
  scheduled_for timestamptz,
  completed_at timestamptz,
  amount_cents integer,
  payment_status text,
  truck_code text,
  crew_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.crm_user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  idempotency_key text unique,
  assigned_to uuid references public.crm_user_profiles(id) on delete set null,
  created_by uuid references public.crm_user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.crm_user_profiles(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_capture_mode_idx on public.leads(capture_mode);
create index if not exists leads_customer_id_idx on public.leads(customer_id);
create index if not exists customers_capture_mode_idx on public.customers(capture_mode);
create index if not exists contacts_customer_id_idx on public.customer_contacts(customer_id);
create index if not exists locations_customer_id_idx on public.service_locations(customer_id);
create index if not exists activities_lead_id_idx on public.lead_activities(lead_id);
create index if not exists tasks_lead_id_idx on public.crm_tasks(lead_id);
create index if not exists tasks_customer_id_idx on public.crm_tasks(customer_id);
create index if not exists audit_entity_idx on public.crm_audit_log(entity_type, entity_id);

create or replace function app_private.current_crm_role()
returns public.crm_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.crm_user_profiles
  where user_id = (select auth.uid())
    and active = true
  limit 1;
$$;

create or replace function app_private.is_crm_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crm_user_profiles
    where user_id = (select auth.uid())
      and active = true
  );
$$;

create or replace function app_private.is_crm_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.current_crm_role() = 'admin'::public.crm_role;
$$;

revoke all on function app_private.current_crm_role() from public, anon, authenticated;
revoke all on function app_private.is_crm_member() from public, anon, authenticated;
revoke all on function app_private.is_crm_admin() from public, anon, authenticated;
grant execute on function app_private.current_crm_role() to authenticated;
grant execute on function app_private.is_crm_member() to authenticated;
grant execute on function app_private.is_crm_admin() to authenticated;

alter table public.crm_user_profiles enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.service_locations enable row level security;
alter table public.lead_customer_links enable row level security;
alter table public.outbox enable row level security;
alter table public.attachments enable row level security;
alter table public.rate_limits enable row level security;
alter table public.events enable row level security;
alter table public.service_records enable row level security;
alter table public.lead_activities enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_audit_log enable row level security;

create policy crm_profiles_read_own_or_admin
on public.crm_user_profiles
for select
to authenticated
using (user_id = (select auth.uid()) or app_private.is_crm_admin());

create policy crm_profiles_admin_insert
on public.crm_user_profiles
for insert
to authenticated
with check (app_private.is_crm_admin());

create policy crm_profiles_admin_update
on public.crm_user_profiles
for update
to authenticated
using (app_private.is_crm_admin())
with check (app_private.is_crm_admin());

create policy crm_profiles_admin_delete
on public.crm_user_profiles
for delete
to authenticated
using (app_private.is_crm_admin());

create policy leads_member_select
on public.leads for select to authenticated
using (app_private.is_crm_member());

create policy leads_member_insert
on public.leads for insert to authenticated
with check (app_private.is_crm_member());

create policy leads_member_update
on public.leads for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy leads_admin_delete
on public.leads for delete to authenticated
using (app_private.is_crm_admin());

create policy customers_member_select
on public.customers for select to authenticated
using (app_private.is_crm_member());

create policy customers_member_insert
on public.customers for insert to authenticated
with check (app_private.is_crm_member());

create policy customers_member_update
on public.customers for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy customers_admin_delete
on public.customers for delete to authenticated
using (app_private.is_crm_admin());

create policy customer_contacts_member_select
on public.customer_contacts for select to authenticated
using (app_private.is_crm_member());

create policy customer_contacts_member_insert
on public.customer_contacts for insert to authenticated
with check (app_private.is_crm_member());

create policy customer_contacts_member_update
on public.customer_contacts for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy customer_contacts_admin_delete
on public.customer_contacts for delete to authenticated
using (app_private.is_crm_admin());

create policy service_locations_member_select
on public.service_locations for select to authenticated
using (app_private.is_crm_member());

create policy service_locations_member_insert
on public.service_locations for insert to authenticated
with check (app_private.is_crm_member());

create policy service_locations_member_update
on public.service_locations for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy service_locations_admin_delete
on public.service_locations for delete to authenticated
using (app_private.is_crm_admin());

create policy lead_customer_links_member_select
on public.lead_customer_links for select to authenticated
using (app_private.is_crm_member());

create policy lead_customer_links_member_insert
on public.lead_customer_links for insert to authenticated
with check (app_private.is_crm_member());

create policy lead_customer_links_member_delete
on public.lead_customer_links for delete to authenticated
using (app_private.is_crm_member());

create policy outbox_member_select
on public.outbox for select to authenticated
using (app_private.is_crm_member());

create policy outbox_admin_manage_all
on public.outbox for all to authenticated
using (app_private.is_crm_admin())
with check (app_private.is_crm_admin());

create policy attachments_member_select
on public.attachments for select to authenticated
using (app_private.is_crm_member());

create policy attachments_member_insert
on public.attachments for insert to authenticated
with check (app_private.is_crm_member());

create policy attachments_admin_delete
on public.attachments for delete to authenticated
using (app_private.is_crm_admin());

create policy rate_limits_admin_all
on public.rate_limits for all to authenticated
using (app_private.is_crm_admin())
with check (app_private.is_crm_admin());

create policy events_member_select
on public.events for select to authenticated
using (app_private.is_crm_member());

create policy events_member_insert
on public.events for insert to authenticated
with check (app_private.is_crm_member());

create policy service_records_member_select
on public.service_records for select to authenticated
using (app_private.is_crm_member());

create policy service_records_member_insert
on public.service_records for insert to authenticated
with check (app_private.is_crm_member());

create policy service_records_member_update
on public.service_records for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy service_records_admin_delete
on public.service_records for delete to authenticated
using (app_private.is_crm_admin());

create policy lead_activities_member_select
on public.lead_activities for select to authenticated
using (app_private.is_crm_member());

create policy lead_activities_member_insert
on public.lead_activities for insert to authenticated
with check (app_private.is_crm_member());

create policy crm_tasks_member_select
on public.crm_tasks for select to authenticated
using (app_private.is_crm_member());

create policy crm_tasks_member_insert
on public.crm_tasks for insert to authenticated
with check (app_private.is_crm_member());

create policy crm_tasks_member_update
on public.crm_tasks for update to authenticated
using (app_private.is_crm_member())
with check (app_private.is_crm_member());

create policy crm_tasks_admin_delete
on public.crm_tasks for delete to authenticated
using (app_private.is_crm_admin());

create policy crm_audit_member_select
on public.crm_audit_log for select to authenticated
using (app_private.is_crm_member());

create policy crm_audit_member_insert
on public.crm_audit_log for insert to authenticated
with check (app_private.is_crm_member());

-- Storage draft. Create private buckets later through migration/admin tooling:
-- lead-uploads, imports, templates, generated-documents, backups.
-- Required policies on storage.objects:
-- 1. CRM members can select objects only from CRM buckets.
-- 2. CRM members can insert into lead-uploads/imports/generated-documents with path ownership/namespace checks.
-- 3. Admins can insert/update/delete templates and backups.
-- 4. Upsert requires select + insert + update policies, so decide deliberately before enabling it.
-- 5. Public buckets are not allowed for CRM documents, imports, backups or generated contracts.

-- Pre-execution checklist:
-- - Confirm Supabase project, region and plan.
-- - Confirm exact Google OAuth redirect URLs.
-- - Confirm admin e-mails; do not rely on user_metadata for authorization.
-- - Run Supabase database linter/advisors in staging.
-- - Test anon access denial, inactive-user denial and attendant/admin separation.
-- - Test backup/export restore in an empty project before cutover.
