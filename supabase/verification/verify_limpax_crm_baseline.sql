select 'public_tables' as check_name, count(*)::text as value
from information_schema.tables
where table_schema='public'
  and table_name in ('leads','outbox','attachments','rate_limits','events','service_records','lead_activities','crm_tasks','crm_user_profiles','customers','customer_contacts','service_locations','lead_customer_links','crm_audit_log')
union all
select 'rls_enabled', count(*)::text
from pg_tables
where schemaname='public'
  and rowsecurity=true
  and tablename in ('leads','outbox','attachments','rate_limits','events','service_records','lead_activities','crm_tasks','crm_user_profiles','customers','customer_contacts','service_locations','lead_customer_links','crm_audit_log')
union all
select 'policies', count(*)::text
from pg_policies
where schemaname in ('public','storage')
  and (tablename <> 'objects' or policyname like 'storage_crm_%')
union all
select 'storage_buckets', count(*)::text
from storage.buckets
where id in ('lead-uploads','imports','templates','generated-documents','backups');
