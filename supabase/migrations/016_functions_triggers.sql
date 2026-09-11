-- ============================================================
-- 016_functions_triggers.sql
-- Automatic timestamp triggers and security definer helper
-- functions to prevent recursive RLS evaluations.
-- ============================================================

-- ----------------------------------------------------------
-- set_updated_at
-- Standardized trigger function to maintain updated_at timestamps.
-- ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists cases_updated_at on public.cases;
create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

drop trigger if exists clinical_findings_updated_at on public.clinical_findings;
create trigger clinical_findings_updated_at
  before update on public.clinical_findings
  for each row execute function public.set_updated_at();

drop trigger if exists hypotheses_updated_at on public.hypotheses;
create trigger hypotheses_updated_at
  before update on public.hypotheses
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------
-- Security definer RLS helpers
-- Set search_path = '' to protect against search_path hijack.
-- Marked stable to allow query planner optimizations.
-- ----------------------------------------------------------

-- Check whether authenticated caller is an active member of target organization
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = (select auth.uid())
      and om.is_active = true
  );
$$;

-- Check whether authenticated caller is an assigned member of target case
create or replace function public.is_case_member(target_case uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_members cm
    where cm.case_id = target_case
      and cm.user_id = (select auth.uid())
  );
$$;

-- Check whether authenticated caller possesses a specific permission code
create or replace function public.has_permission(permission_code text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.name = om.role_name
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where om.user_id = (select auth.uid())
      and om.is_active = true
      and p.code = permission_code
  );
$$;
