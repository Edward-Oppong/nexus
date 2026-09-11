-- ============================================================
-- 001_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

-- UUID generation (gen_random_uuid)
create extension if not exists "pgcrypto";

-- Full-text search and fuzzy matching
create extension if not exists "pg_trgm";

-- IP address types (used by audit_events)
-- inet is a native PG type, no extension needed

-- pgvector — reserved for Phase 6G evidence embeddings
-- create extension if not exists "vector";
-- Uncomment when embedding-based evidence search is introduced.
