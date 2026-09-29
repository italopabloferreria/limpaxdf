-- Synthetic, transactional RLS probe for the read-only CRM preview.
-- Run only after the 20260928210000 SELECT grants are applied.
-- This uses simulated JWT claims and DOES NOT replace testing a second real Google JWT.
-- The final ROLLBACK removes every synthetic row.

begin;

do $preflight$
begin
  if (select count(*) from public.leads) <> 0
     or (select count(*) from public.customers) <> 0
     or (select count(*) from public.customer_contacts) <> 0
     or (select count(*) from public.service_locations) <> 0
     or (select count(*) from public.crm_user_profiles
         where active and is_super_admin and user_id is not null) <> 1
     or exists (select 1 from public.crm_user_profiles
         where user_id = '00000000-0000-4000-8000-000000000001'::uuid) then
    raise exception 'CRM read probe preflight changed; abort';
  end if;
end
$preflight$;

insert into public.customers
  (id, kind, name, source_mode, origin, import_batch, created_at, updated_at)
values
  ('homologation-read-20260929-customer', 'person', 'SYNTHETIC TEST ONLY',
   'review', 'homologation', 'homologation-read-20260929',
   floor(extract(epoch from now()) * 1000)::bigint,
   floor(extract(epoch from now()) * 1000)::bigint);

insert into public.customer_contacts
  (id, customer_id, name, created_at, updated_at)
values
  ('homologation-read-20260929-contact',
   'homologation-read-20260929-customer', 'SYNTHETIC TEST ONLY',
   floor(extract(epoch from now()) * 1000)::bigint,
   floor(extract(epoch from now()) * 1000)::bigint);

insert into public.service_locations
  (id, customer_id, label, created_at, updated_at)
values
  ('homologation-read-20260929-location',
   'homologation-read-20260929-customer', 'SYNTHETIC TEST ONLY',
   floor(extract(epoch from now()) * 1000)::bigint,
   floor(extract(epoch from now()) * 1000)::bigint);

do $owner_claim$
begin
  perform set_config('request.jwt.claim.sub',
    (select user_id::text from public.crm_user_profiles
     where active and is_super_admin and user_id is not null), true);
end
$owner_claim$;

set local role authenticated;

do $owner_assert$
begin
  if (select count(*) from public.customers
      where id = 'homologation-read-20260929-customer') <> 1
     or (select count(*) from public.customer_contacts
      where id = 'homologation-read-20260929-contact') <> 1
     or (select count(*) from public.service_locations
      where id = 'homologation-read-20260929-location') <> 1 then
    raise exception 'CRM owner cannot read all synthetic customer rows';
  end if;
end
$owner_assert$;

reset role;
select set_config('request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $unprofiled_assert$
begin
  if (select count(*) from public.customers
      where id = 'homologation-read-20260929-customer') <> 0
     or (select count(*) from public.customer_contacts
      where id = 'homologation-read-20260929-contact') <> 0
     or (select count(*) from public.service_locations
      where id = 'homologation-read-20260929-location') <> 0 then
    raise exception 'Unprofiled claim can read synthetic customer rows';
  end if;
end
$unprofiled_assert$;

reset role;
rollback;
