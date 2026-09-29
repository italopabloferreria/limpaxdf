-- Owner-only synthetic CRM leads on Vercel Preview. No public intake or outbox.
-- Apply incrementally after a transactional probe; do not run db push while
-- SQL Editor history and CLI migration history differ.
begin;

create or replace function app_private.crm_save_review_lead(
  p_action text,
  p_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_problem text,
  p_region text,
  p_status text,
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
  v_payload jsonb;
  v_rows integer;
  v_lead public.leads%rowtype;
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
     or p_name is null or p_name <> btrim(p_name) or char_length(p_name) < 2 or char_length(p_name) > 180 or p_name ~ '[[:cntrl:]]'
     or p_phone is null or char_length(p_phone) > 40 or p_phone ~ '[[:cntrl:]]'
     or p_email is null or char_length(p_email) > 254 or p_email ~ '[[:cntrl:]]'
     or p_problem is null or p_problem <> btrim(p_problem) or char_length(p_problem) < 2 or char_length(p_problem) > 500 or p_problem ~ '[[:cntrl:]]'
     or p_region is null or char_length(p_region) > 120 or p_region ~ '[[:cntrl:]]'
     or p_status is null or p_status not in ('novo','em_contato','qualificado','orcamento','agendado','em_execucao','concluido','recorrencia','cancelado')
     or (p_action = 'create' and (p_expected_updated_at is not null or p_status <> 'novo'))
     or (p_action = 'update' and p_expected_updated_at is null) then
    raise exception 'Invalid CRM lead input' using errcode = '22023';
  end if;

  v_payload := jsonb_build_object('name',p_name,'phone',p_phone,'email',p_email,'problem',p_problem,'region',p_region,'property','');
  if p_action = 'create' then
    insert into public.leads
      (id,idempotency,payload_hash,payload,mode,origin,status,created_at,updated_at,
       privacy_version,marketing,upload_hash,upload_expires,upload_count)
    values
      (v_id,'crm_preview:' || v_id,md5(v_payload::text),v_payload,
       'review'::public.data_mode,'crm_preview','novo'::public.crm_status,v_now,v_now,
       'crm-preview',false,'',0,0)
    on conflict (id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      select * into v_lead from public.leads where id = v_id;
      if v_lead.id is null or v_lead.origin <> 'crm_preview'
         or v_lead.mode <> 'review'::public.data_mode
         or v_lead.payload <> v_payload or v_lead.status <> 'novo'::public.crm_status then
        raise exception 'Lead ID already used' using errcode = 'P0002';
      end if;
      return v_id;
    end if;
  else
    update public.leads lead
    set payload = v_payload,
        payload_hash = md5(v_payload::text),
        status = p_status::public.crm_status,
        updated_at = greatest(v_now,coalesce(lead.updated_at,lead.created_at) + 1)
    where lead.id = v_id
      and lead.origin = 'crm_preview'
      and lead.mode = 'review'::public.data_mode
      and lead.updated_at = p_expected_updated_at;
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'Lead changed or unavailable' using errcode = 'P0002';
    end if;
  end if;

  insert into public.crm_audit_log
    (id,entity_type,entity_id,action,author,data,created_at)
  values
    (gen_random_uuid()::text,'lead',v_id,
     case when p_action = 'create' then 'created' else 'updated' end,
     (select auth.uid())::text,jsonb_build_object('source','crm_preview','status',p_status),v_now);
  return v_id;
end
$function$;

revoke all on function app_private.crm_save_review_lead(text,uuid,text,text,text,text,text,text,bigint) from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.crm_save_review_lead(text,uuid,text,text,text,text,text,text,bigint) to authenticated;

create or replace function public.crm_save_review_lead(
  p_action text,
  p_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_problem text,
  p_region text,
  p_status text,
  p_expected_updated_at bigint
)
returns text
language sql
security invoker
set search_path = ''
as $function$
  select app_private.crm_save_review_lead(p_action,p_id,p_name,p_phone,p_email,p_problem,p_region,p_status,p_expected_updated_at);
$function$;

revoke all on function public.crm_save_review_lead(text,uuid,text,text,text,text,text,text,bigint) from public, anon, authenticated;
grant execute on function public.crm_save_review_lead(text,uuid,text,text,text,text,text,text,bigint) to authenticated;

commit;
