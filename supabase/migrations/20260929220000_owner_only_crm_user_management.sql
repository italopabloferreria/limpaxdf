-- Only the sole active CRM superadmin may manage Google approvals or profiles.
-- Incremental policy change; existing rows, Auth hook and D1/R2 remain intact.
begin;

alter policy crm_google_approvals_admin_read
  on public.crm_google_approvals
  using (app_private.is_crm_super_admin());

alter policy crm_google_approvals_admin_insert
  on public.crm_google_approvals
  with check (
    approved_by = (select auth.uid())
    and active
    and app_private.is_crm_super_admin()
  );

alter policy crm_google_approvals_admin_update
  on public.crm_google_approvals
  using (app_private.is_crm_super_admin())
  with check (app_private.is_crm_super_admin());

-- Profile writes are not granted to authenticated by the current Data API,
-- but these policies must remain restrictive if a future grant is introduced.
alter policy crm_user_profiles_admin_insert
  on public.crm_user_profiles
  with check (
    user_id is not null
    and not is_super_admin
    and app_private.is_crm_super_admin()
  );

alter policy crm_user_profiles_admin_update
  on public.crm_user_profiles
  using (
    not is_super_admin
    and app_private.is_crm_super_admin()
  )
  with check (
    user_id is not null
    and not is_super_admin
    and app_private.is_crm_super_admin()
  );

alter policy crm_user_profiles_admin_delete
  on public.crm_user_profiles
  using (
    not is_super_admin
    and app_private.is_crm_super_admin()
  );

commit;
