-- Probe for 20260929120000_crm_preview_lead_write.sql.
-- In the SQL Editor, paste the exact migration, replace its final COMMIT with
-- this block, and run the entire buffer once. The initial BEGIN is retained.
-- The final ROLLBACK removes the function definition and all synthetic rows.

select set_config('request.jwt.claim.sub', (
  select user_id::text from public.crm_user_profiles
  where active = true and role = 'admin'::public.crm_role and is_super_admin = true
  limit 1
), true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;

do $probe$
declare
  v_id constant uuid := '123e4567-e89b-42d3-a456-426614174099';
  v_version bigint;
  v_audits integer;
  v_denied boolean := false;
begin
  if public.crm_save_review_lead('create',v_id,'Atendimento Fictício Probe','','',
    'Solicitação fictícia de teste','','novo',null) <> v_id::text then
    raise exception 'Lead create returned wrong ID';
  end if;
  if public.crm_save_review_lead('create',v_id,'Atendimento Fictício Probe','','',
    'Solicitação fictícia de teste','','novo',null) <> v_id::text then
    raise exception 'Idempotent retry returned wrong ID';
  end if;
  select updated_at into v_version from public.leads where id = v_id::text;
  if v_version is null then raise exception 'Synthetic lead missing'; end if;
  if public.crm_save_review_lead('update',v_id,'Atendimento Fictício Editado','','',
    'Solicitação fictícia editada','','em_contato',v_version) <> v_id::text then
    raise exception 'Lead update returned wrong ID';
  end if;
  begin
    perform public.crm_save_review_lead('update',v_id,'Edição antiga','','',
      'Deve ser recusada','','concluido',v_version);
  exception when sqlstate 'P0002' then v_denied := true;
  end;
  if not v_denied then raise exception 'Stale update was accepted'; end if;
  select count(*) into v_audits from public.crm_audit_log
  where entity_type = 'lead' and entity_id = v_id::text;
  if v_audits <> 2 then raise exception 'Expected two audit events, got %',v_audits; end if;
  if not exists (select 1 from public.leads where id = v_id::text
    and mode = 'review'::public.data_mode and origin = 'crm_preview'
    and status = 'em_contato'::public.crm_status) then
    raise exception 'Lead state is wrong';
  end if;
end
$probe$;

select set_config('request.jwt.claim.sub','123e4567-e89b-42d3-a456-426614174098',true);
do $probe$
declare v_denied boolean := false;
begin
  begin
    perform public.crm_save_review_lead('create',
      '123e4567-e89b-42d3-a456-426614174097'::uuid,
      'Usuário sem perfil','','','Deve ser recusado','','novo',null);
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'Unprofiled claim was accepted'; end if;
end
$probe$;

reset role;
rollback;

-- Run this separate read-only query after the probe to verify zero residue:
-- select
--   (select count(*) from public.leads where origin = 'crm_preview') as preview_leads,
--   (select count(*) from public.crm_audit_log
--     where entity_type = 'lead' and entity_id = '123e4567-e89b-42d3-a456-426614174099') as probe_audits,
--   to_regprocedure('public.crm_save_review_lead(text,uuid,text,text,text,text,text,text,bigint)') is not null as function_exists;
