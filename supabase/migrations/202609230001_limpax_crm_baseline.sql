-- LIMPAX CRM — Supabase homologation baseline
-- Generated from current Cloudflare D1 schema and docs/supabase/SCHEMA_RLS_DRAFT.sql.
-- Target project: Limpax Brasil / sa-east-1 / lkamarbpjqlibxlmcico.
-- This migration creates structure and RLS only. It does not import real data.

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

do $$ begin
  create type public.crm_role as enum ('admin','attendant');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.data_mode as enum ('review','live','archive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.crm_status as enum ('novo','em_contato','qualificado','orcamento','agendado','em_execucao','concluido','recorrencia','cancelado');
exception when duplicate_object then null;
end $$;

create table if not exists public.leads (
  seq bigserial primary key,
  id text not null unique,
  idempotency text not null unique,
  payload_hash text not null,
  payload jsonb not null,
  mode public.data_mode not null,
  origin text not null default 'unknown',
  import_batch text,
  status public.crm_status not null default 'novo',
  created_at bigint not null,
  updated_at bigint,
  assigned_to text,
  next_action_at bigint,
  privacy_version text not null,
  marketing boolean not null default false,
  upload_hash text not null,
  upload_expires bigint not null,
  upload_count integer not null default 0
);

create index if not exists idx_leads_created on public.leads(created_at);
create index if not exists idx_leads_status_updated on public.leads(status, updated_at);
create index if not exists idx_leads_mode_origin on public.leads(mode, origin);

create table if not exists public.outbox (
  lead_id text primary key references public.leads(id) on delete cascade,
  state text not null default 'pending',
  attempts integer not null default 0,
  next_attempt bigint not null default 0,
  lease_until bigint not null default 0,
  delivered_at bigint,
  last_error text
);

create index if not exists idx_outbox_pending on public.outbox(state, next_attempt);

create table if not exists public.attachments (
  id text primary key,
  lead_id text not null references public.leads(id) on delete cascade,
  object_key text not null,
  mime text not null,
  bytes bigint not null,
  created_at bigint not null
);

create index if not exists idx_attachments_lead on public.attachments(lead_id);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  expires bigint not null
);

create index if not exists idx_rates_expires on public.rate_limits(expires);

create table if not exists public.events (
  day text not null,
  event text not null,
  count integer not null,
  constraint events_day_event_unique unique(day,event)
);

create table if not exists public.service_records (
  id text primary key,
  lead_id text references public.leads(id) on delete set null,
  completed_at bigint,
  category text,
  vehicle_id text,
  next_review bigint,
  interval_days integer
);

create table if not exists public.lead_activities (
  id text primary key,
  lead_id text not null references public.leads(id) on delete cascade,
  kind text not null,
  body text not null,
  author text not null,
  created_at bigint not null
);

create index if not exists idx_activities_lead on public.lead_activities(lead_id, created_at);

create table if not exists public.crm_tasks (
  id text primary key,
  lead_id text not null references public.leads(id) on delete cascade,
  title text not null,
  due_at bigint,
  assignee text,
  completed_at bigint,
  created_at bigint not null,
  idempotency_key text,
  request_hash text,
  constraint crm_tasks_lead_idempotency_unique unique(lead_id,idempotency_key)
);

create index if not exists idx_tasks_lead on public.crm_tasks(lead_id, completed_at);

create table if not exists public.crm_user_profiles (
  email text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text,
  role public.crm_role not null,
  active boolean not null default true,
  last_seen_at bigint,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_crm_users_role_active on public.crm_user_profiles(role, active);
create index if not exists idx_crm_users_user_id on public.crm_user_profiles(user_id);

create table if not exists public.customers (
  id text primary key,
  kind text not null,
  name text not null,
  trade_name text,
  tax_id text,
  tax_id_normalized text unique,
  notes text,
  source_mode public.data_mode not null default 'review',
  origin text not null default 'unknown',
  import_batch text,
  created_at bigint not null,
  updated_at bigint not null,
  archived_at bigint
);

create index if not exists idx_customers_name on public.customers(name);
create index if not exists idx_customers_source_mode on public.customers(source_mode);

create table if not exists public.customer_contacts (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  phone_normalized text,
  email text,
  is_primary boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_contacts_customer on public.customer_contacts(customer_id);
create index if not exists idx_contacts_phone on public.customer_contacts(phone_normalized);
create index if not exists idx_contacts_email on public.customer_contacts(email);

create table if not exists public.service_locations (
  id text primary key,
  customer_id text not null references public.customers(id) on delete cascade,
  label text not null,
  postal_code text,
  address text,
  number text,
  complement text,
  district text,
  city text,
  state text,
  reference text,
  access_notes text,
  is_primary boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists idx_locations_customer on public.service_locations(customer_id);

create table if not exists public.lead_customer_links (
  lead_id text primary key references public.leads(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete cascade,
  contact_id text references public.customer_contacts(id) on delete set null,
  location_id text references public.service_locations(id) on delete set null,
  linked_at bigint not null,
  linked_by text not null
);

create index if not exists idx_lead_customer_customer on public.lead_customer_links(customer_id);

create table if not exists public.crm_audit_log (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  author text not null,
  data jsonb,
  created_at bigint not null
);

create index if not exists idx_audit_entity on public.crm_audit_log(entity_type, entity_id, created_at);
create index if not exists idx_audit_author on public.crm_audit_log(author, created_at);

create or replace function app_private.current_crm_email()
returns text
language sql
stable
security invoker
as $$
  select lower(coalesce((select auth.jwt() ->> 'email'), ''));
$$;

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
      and (
        (p.user_id is not null and p.user_id = (select auth.uid()))
        or lower(p.email) = app_private.current_crm_email()
      )
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
      and (
        (p.user_id is not null and p.user_id = (select auth.uid()))
        or lower(p.email) = app_private.current_crm_email()
      )
  );
$$;

revoke all on function app_private.current_crm_email() from public, anon, authenticated;
revoke all on function app_private.is_crm_member() from public, anon, authenticated;
revoke all on function app_private.is_crm_admin() from public, anon, authenticated;
grant execute on function app_private.current_crm_email() to authenticated;
grant execute on function app_private.is_crm_member() to authenticated;
grant execute on function app_private.is_crm_admin() to authenticated;

alter table public.leads enable row level security;
alter table public.outbox enable row level security;
alter table public.attachments enable row level security;
alter table public.rate_limits enable row level security;
alter table public.events enable row level security;
alter table public.service_records enable row level security;
alter table public.lead_activities enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_user_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.service_locations enable row level security;
alter table public.lead_customer_links enable row level security;
alter table public.crm_audit_log enable row level security;

create policy crm_user_profiles_read_own_or_admin on public.crm_user_profiles for select to authenticated
using (lower(email)=app_private.current_crm_email() or user_id=(select auth.uid()) or app_private.is_crm_admin());
create policy crm_user_profiles_admin_insert on public.crm_user_profiles for insert to authenticated
with check (app_private.is_crm_admin());
create policy crm_user_profiles_admin_update on public.crm_user_profiles for update to authenticated
using (app_private.is_crm_admin()) with check (app_private.is_crm_admin());
create policy crm_user_profiles_admin_delete on public.crm_user_profiles for delete to authenticated
using (app_private.is_crm_admin());

create policy leads_member_select on public.leads for select to authenticated using (app_private.is_crm_member());
create policy leads_member_insert on public.leads for insert to authenticated with check (app_private.is_crm_member());
create policy leads_member_update on public.leads for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy leads_admin_delete on public.leads for delete to authenticated using (app_private.is_crm_admin());

create policy outbox_member_select on public.outbox for select to authenticated using (app_private.is_crm_member());
create policy outbox_admin_all on public.outbox for all to authenticated using (app_private.is_crm_admin()) with check (app_private.is_crm_admin());

create policy attachments_member_select on public.attachments for select to authenticated using (app_private.is_crm_member());
create policy attachments_member_insert on public.attachments for insert to authenticated with check (app_private.is_crm_member());
create policy attachments_admin_delete on public.attachments for delete to authenticated using (app_private.is_crm_admin());

create policy rate_limits_admin_all on public.rate_limits for all to authenticated using (app_private.is_crm_admin()) with check (app_private.is_crm_admin());

create policy events_member_select on public.events for select to authenticated using (app_private.is_crm_member());
create policy events_member_insert on public.events for insert to authenticated with check (app_private.is_crm_member());
create policy events_member_update on public.events for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());

create policy service_records_member_select on public.service_records for select to authenticated using (app_private.is_crm_member());
create policy service_records_member_insert on public.service_records for insert to authenticated with check (app_private.is_crm_member());
create policy service_records_member_update on public.service_records for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy service_records_admin_delete on public.service_records for delete to authenticated using (app_private.is_crm_admin());

create policy lead_activities_member_select on public.lead_activities for select to authenticated using (app_private.is_crm_member());
create policy lead_activities_member_insert on public.lead_activities for insert to authenticated with check (app_private.is_crm_member());

create policy crm_tasks_member_select on public.crm_tasks for select to authenticated using (app_private.is_crm_member());
create policy crm_tasks_member_insert on public.crm_tasks for insert to authenticated with check (app_private.is_crm_member());
create policy crm_tasks_member_update on public.crm_tasks for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy crm_tasks_admin_delete on public.crm_tasks for delete to authenticated using (app_private.is_crm_admin());

create policy customers_member_select on public.customers for select to authenticated using (app_private.is_crm_member());
create policy customers_member_insert on public.customers for insert to authenticated with check (app_private.is_crm_member());
create policy customers_member_update on public.customers for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy customers_admin_delete on public.customers for delete to authenticated using (app_private.is_crm_admin());

create policy customer_contacts_member_select on public.customer_contacts for select to authenticated using (app_private.is_crm_member());
create policy customer_contacts_member_insert on public.customer_contacts for insert to authenticated with check (app_private.is_crm_member());
create policy customer_contacts_member_update on public.customer_contacts for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy customer_contacts_admin_delete on public.customer_contacts for delete to authenticated using (app_private.is_crm_admin());

create policy service_locations_member_select on public.service_locations for select to authenticated using (app_private.is_crm_member());
create policy service_locations_member_insert on public.service_locations for insert to authenticated with check (app_private.is_crm_member());
create policy service_locations_member_update on public.service_locations for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy service_locations_admin_delete on public.service_locations for delete to authenticated using (app_private.is_crm_admin());

create policy lead_customer_links_member_select on public.lead_customer_links for select to authenticated using (app_private.is_crm_member());
create policy lead_customer_links_member_insert on public.lead_customer_links for insert to authenticated with check (app_private.is_crm_member());
create policy lead_customer_links_member_update on public.lead_customer_links for update to authenticated using (app_private.is_crm_member()) with check (app_private.is_crm_member());
create policy lead_customer_links_member_delete on public.lead_customer_links for delete to authenticated using (app_private.is_crm_member());

create policy crm_audit_log_member_select on public.crm_audit_log for select to authenticated using (app_private.is_crm_member());
create policy crm_audit_log_member_insert on public.crm_audit_log for insert to authenticated with check (app_private.is_crm_member());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lead-uploads','lead-uploads',false,10485760,null),
  ('imports','imports',false,52428800,null),
  ('templates','templates',false,10485760,null),
  ('generated-documents','generated-documents',false,52428800,null),
  ('backups','backups',false,1073741824,null)
on conflict (id) do nothing;

create policy storage_crm_member_select on storage.objects for select to authenticated
using (bucket_id in ('lead-uploads','imports','templates','generated-documents','backups') and app_private.is_crm_member());
create policy storage_crm_member_insert_operational on storage.objects for insert to authenticated
with check (bucket_id in ('lead-uploads','imports','generated-documents') and app_private.is_crm_member());
create policy storage_crm_admin_insert_admin_buckets on storage.objects for insert to authenticated
with check (bucket_id in ('templates','backups') and app_private.is_crm_admin());
create policy storage_crm_admin_update on storage.objects for update to authenticated
using (bucket_id in ('lead-uploads','imports','templates','generated-documents','backups') and app_private.is_crm_admin())
with check (bucket_id in ('lead-uploads','imports','templates','generated-documents','backups') and app_private.is_crm_admin());
create policy storage_crm_admin_delete on storage.objects for delete to authenticated
using (bucket_id in ('lead-uploads','imports','templates','generated-documents','backups') and app_private.is_crm_admin());
