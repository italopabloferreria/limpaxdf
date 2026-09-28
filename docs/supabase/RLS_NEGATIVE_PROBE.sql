-- S01: teste transitório de negação RLS. NÃO executar sem autorização específica.
-- Projeto: lkamarbpjqlibxlmcico. Executar o arquivo inteiro no SQL Editor.
-- Pré-condições: exatamente um auth.users, nenhum perfil CRM e nenhum lead.
-- A transação insere um lead 100% sintético e o remove com ROLLBACK.
-- O teste usa SET LOCAL ROLE authenticated; não substitui um teste com JWT real.

begin;

do $preflight$
begin
  if (select count(*) from auth.users) <> 1
     or (select count(*) from public.crm_user_profiles) <> 0
     or (select count(*) from public.leads) <> 0 then
    raise exception 'S01 preflight changed; inspect project before testing';
  end if;
end
$preflight$;

insert into public.leads
  (id, idempotency, payload_hash, payload, mode, origin, import_batch,
   status, created_at, privacy_version, upload_hash, upload_expires)
values
  ('homologation-rls-deny-20260928', 'homologation-rls-deny-20260928',
   'synthetic-only', '{}'::jsonb, 'review', 'homologation',
   'homologation-rls-deny-20260928', 'novo',
   floor(extract(epoch from now()) * 1000)::bigint,
   'homologation-only', 'synthetic-only', 0);

do $claims$
begin
  perform set_config('request.jwt.claim.sub',
    (select id::text from auth.users limit 1), true);
end
$claims$;

set local role authenticated;

do $assertions$
begin
  if auth.uid() is null then
    raise exception 'S01 test claim is missing';
  end if;
  if (select count(*) from public.crm_user_profiles) <> 0 then
    raise exception 'S01 unprofiled user can read a CRM profile';
  end if;
  if (select count(*) from public.leads
      where id = 'homologation-rls-deny-20260928') <> 0 then
    raise exception 'S01 unprofiled user can read the synthetic lead';
  end if;
end
$assertions$;

reset role;
rollback;

-- Após Success, executar separadamente:
-- select count(*) from public.leads where id = 'homologation-rls-deny-20260928';
-- Esperado: 0. Se qualquer comando falhar, confirmar ROLLBACK e investigar.
