-- Preview-only customer reads. Applying this does not enable the Vercel data flag.
-- Preflight on 2026-09-28: RLS on all three tables; anon and authenticated
-- held no table privileges. Leads already had authenticated SELECT only.
-- Baseline RLS policies still require an active, bound CRM profile.
begin;

grant select on table public.customers,
  public.customer_contacts, public.service_locations to authenticated;

commit;
