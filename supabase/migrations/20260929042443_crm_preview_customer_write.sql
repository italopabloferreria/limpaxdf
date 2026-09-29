-- Preview-only customer create/update. Apply only after the read-only JWT/RLS gate.
-- This does not import data or change D1/R2. Do not run db push until SQL Editor
-- history has been reconciled with the CLI migration history.

begin;

create or replace function app_private.crm_save_review_customer(
  p_action text,
  p_id uuid,
  p_kind text,
  p_name text,
  p_trade_name text,
  p_expected_updated_at bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id text := p_id::text;
  v_now bigint := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_rows integer;
  v_customer public.customers%rowtype;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.crm_user_profiles profile
    where profile.user_id = (select auth.uid())
      and profile.active = true
      and profile.role = 'admin'::public.crm_role
      and profile.is_super_admin = true
  ) then
    raise exception 'CRM owner access required' using errcode = '42501';
  end if;

  if p_action is null or p_action not in ('create','update')
     or p_id is null
     or p_kind is null or p_kind not in ('person','organization')
     or p_name is null or p_name <> btrim(p_name)
     or char_length(p_name) < 2 or char_length(p_name) > 180
     or p_name ~ '[[:cntrl:]]'
     or (p_trade_name is not null and (
       p_trade_name <> btrim(p_trade_name)
       or char_length(p_trade_name) > 180
       or p_trade_name ~ '[[:cntrl:]]'))
     or (p_action = 'create' and p_expected_updated_at is not null)
     or (p_action = 'update' and p_expected_updated_at is null) then
    raise exception 'Invalid CRM customer input' using errcode = '22023';
  end if;

  if p_action = 'create' then
    insert into public.customers
      (id,kind,name,trade_name,source_mode,origin,created_at,updated_at)
    values
      (v_id,p_kind,p_name,p_trade_name,'review'::public.data_mode,
       'crm_preview',v_now,v_now)
    on conflict (id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      select * into v_customer from public.customers where id = v_id;
      if v_customer.id is null
         or v_customer.origin <> 'crm_preview'
         or v_customer.source_mode <> 'review'::public.data_mode
         or v_customer.archived_at is not null
         or v_customer.kind <> p_kind
         or v_customer.name <> p_name
         or v_customer.trade_name is distinct from p_trade_name then
        raise exception 'Customer ID already used' using errcode = 'P0002';
      end if;
      return v_id;
    end if;
  else
    update public.customers customer
    set kind = p_kind,
        name = p_name,
        trade_name = p_trade_name,
        updated_at = greatest(v_now,customer.updated_at + 1)
    where customer.id = v_id
      and customer.origin = 'crm_preview'
      and customer.source_mode = 'review'::public.data_mode
      and customer.archived_at is null
      and customer.updated_at = p_expected_updated_at;
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'Customer changed or unavailable' using errcode = 'P0002';
    end if;
  end if;

  insert into public.crm_audit_log
    (id,entity_type,entity_id,action,author,data,created_at)
  values
    (gen_random_uuid()::text,'customer',v_id,
     case when p_action = 'create' then 'created' else 'updated' end,
     (select auth.uid())::text,
     jsonb_build_object('source','crm_preview','kind',p_kind),v_now);
  return v_id;
end
$function$;

revoke all on function app_private.crm_save_review_customer(text,uuid,text,text,text,bigint) from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.crm_save_review_customer(text,uuid,text,text,text,bigint) to authenticated;

create or replace function public.crm_save_review_customer(
  p_action text,
  p_id uuid,
  p_kind text,
  p_name text,
  p_trade_name text,
  p_expected_updated_at bigint
)
returns text
language sql
security invoker
set search_path = ''
as $function$
  select app_private.crm_save_review_customer(
    p_action,p_id,p_kind,p_name,p_trade_name,p_expected_updated_at
  );
$function$;

revoke all on function public.crm_save_review_customer(text,uuid,text,text,text,bigint) from public, anon, authenticated;
grant execute on function public.crm_save_review_customer(text,uuid,text,text,text,bigint) to authenticated;

commit;
