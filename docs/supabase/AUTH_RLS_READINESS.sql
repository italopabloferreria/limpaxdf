-- LIMPAX CRM — Supabase Auth/RLS readiness checks and minimal Data API grants
-- Do not run without explicit authorization for the homologation project.
-- This file is not a replacement for the applied baseline migration.
-- Purpose: make the next remote validation reviewable before enabling SUPABASE_DATA_MODE=read_only.

-- 1) Data API grants required by the current read-only leads/workspace adapter.
-- Supabase Data API grants are evaluated before RLS. Without SELECT grants,
-- PostgREST can return 42501 before policies such as leads_member_select run.
grant select on public.leads to authenticated;
grant select on public.crm_user_profiles to authenticated;

-- 2) RLS/policy presence checks expected to return rows with ok = true.
select 'leads_rls_enabled' as check_name,
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'leads'
      and c.relrowsecurity
  ) as ok;

select 'crm_user_profiles_rls_enabled' as check_name,
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'crm_user_profiles'
      and c.relrowsecurity
  ) as ok;

select 'leads_member_select_policy' as check_name,
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'leads_member_select'
      and 'authenticated' = any(roles)
  ) as ok;

select 'crm_profile_policy' as check_name,
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_user_profiles'
      and policyname = 'crm_user_profiles_read_own_or_admin'
      and 'authenticated' = any(roles)
  ) as ok;

-- 3) Current adapter smoke query. Use only synthetic/homologation data.
-- Expected for a profiled CRM member: zero or more rows, no 42501, no RLS denial.
-- Expected for an authenticated user without active crm_user_profiles row: zero rows.
select seq, id, payload, status, mode, created_at, updated_at, assigned_to, next_action_at
from public.leads
order by updated_at desc nulls last, created_at desc, id desc
limit 1;
