
ALTER TABLE schemes
  ADD COLUMN IF NOT EXISTS interest_rate_slabs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slab_mode VARCHAR DEFAULT 'prospective',
  ADD COLUMN IF NOT EXISTS penalty_slabs JSONB DEFAULT '[]'::jsonb;

ALTER TABLE scheme_versions
  ADD COLUMN IF NOT EXISTS interest_rate_slabs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slab_mode VARCHAR DEFAULT 'prospective',
  ADD COLUMN IF NOT EXISTS penalty_slabs JSONB DEFAULT '[]'::jsonb;
