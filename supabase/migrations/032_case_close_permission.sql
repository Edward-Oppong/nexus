-- ============================================================
-- 032_case_close_permission.sql
-- Adds case.close permission and a dedicated RLS UPDATE policy
-- so that clinicians and org_admins can soft-delete (close) cases.
--
-- Root cause: deleteCase.ts called UPDATE cases SET status='RESOLVED'
-- which hit the case_edit_permission RLS policy requiring case.edit.
-- Users without that permission received 401 permission denied.
-- ============================================================

-- 1. Register the permission if it doesn't exist yet
insert into public.permissions (code, description)
values ('case.close', 'Close or archive a clinical case')
on conflict (code) do nothing;

-- 2. Grant case.close to clinician role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'clinician'
  and p.code  = 'case.close'
on conflict do nothing;

-- 3. Grant case.close to organization_admin role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'organization_admin'
  and p.code  = 'case.close'
on conflict do nothing;

-- 4. Grant case.close to reviewer role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'reviewer'
  and p.code  = 'case.close'
on conflict do nothing;

-- 5. Add a dedicated RLS UPDATE policy for case closure / soft-delete.
--    A user must be an org member with case.close permission,
--    OR be an assigned case member (attending clinician on the case).
drop policy if exists "case_close_permission" on public.cases;
create policy "case_close_permission"
  on public.cases for update to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  )
  with check (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  );
