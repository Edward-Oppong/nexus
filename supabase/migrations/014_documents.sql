-- ============================================================
-- 014_documents.sql
-- Document metadata for files stored in Supabase Storage.
-- Actual file blobs live in Supabase Storage buckets,
-- Postgres stores structured references, mime types, and links.
-- ============================================================

create table public.documents (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete restrict,
  case_id         uuid        references public.cases(id)                  on delete cascade,
  document_type   text        not null,              -- 'LAB_REPORT', 'RADIOLOGY_DICOM', 'REFERRAL_LETTER', 'DISCHARGE_SUMMARY'
  file_name       text        not null,
  storage_path    text        not null,              -- Path inside Supabase Storage bucket
  mime_type       text,
  uploaded_by     uuid        references public.profiles(id),
  created_at      timestamptz not null default now()
);

comment on table public.documents is
  'Metadata for documents and attachments stored in Supabase Storage buckets. '
  'Postgres stores pointers and classifications; blobs reside in object storage.';
