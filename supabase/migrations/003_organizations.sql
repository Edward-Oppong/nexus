-- ============================================================
-- 003_organizations.sql
-- Multi-tenancy foundation. Every clinical resource is scoped
-- to an organization. A single user may belong to many orgs.
-- ============================================================

create table public.organizations (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  organization_type   text,                          -- e.g. 'HOSPITAL', 'CLINIC', 'DEMO'
  country_code        text,                          -- ISO 3166-1 alpha-2
  timezone            text,                          -- IANA timezone string
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.organizations              is 'Tenants. Each hospital, clinic, or demo environment is an organization.';
comment on column public.organizations.country_code is 'ISO 3166-1 alpha-2 country code, e.g. "NG", "GB", "US".';
comment on column public.organizations.timezone     is 'IANA timezone identifier, e.g. "Africa/Lagos".';
