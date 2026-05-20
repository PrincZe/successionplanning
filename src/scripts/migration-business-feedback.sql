-- Migration: Business Feedback Items (2026-05-20)
-- Items: 1 (rename 4-10→5-10), 3 (add AO scheme), 4 (rank), 5 (agencies), 7 (LP), 8 (posting history)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1A: Rename '4-10_years' → '5-10_years' in position_successors
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE position_successors DROP CONSTRAINT IF EXISTS position_successors_succession_type_check;
UPDATE position_successors SET succession_type = '5-10_years' WHERE succession_type = '4-10_years';
ALTER TABLE position_successors ADD CONSTRAINT position_successors_succession_type_check
  CHECK (succession_type IN ('0-4_years', '5-10_years'));

-- Rename in successor_changes
ALTER TABLE successor_changes DROP CONSTRAINT IF EXISTS successor_changes_succession_type_check;
UPDATE successor_changes SET succession_type = '5-10_years' WHERE succession_type = '4-10_years';
ALTER TABLE successor_changes ADD CONSTRAINT successor_changes_succession_type_check
  CHECK (succession_type IN ('0-4_years', '5-10_years'));

-- Update cached JSONB in successor_recommendations (recommended_band field)
UPDATE successor_recommendations
SET candidates = regexp_replace(candidates::text, '4-10_years', '5-10_years', 'g')::jsonb
WHERE candidates::text LIKE '%4-10_years%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1B: Add rank column to position_successors
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE position_successors ADD COLUMN rank integer;

-- Backfill: assign rank based on created_at order within each (position_id, succession_type)
WITH ranked AS (
  SELECT position_id, successor_id, succession_type,
         ROW_NUMBER() OVER (PARTITION BY position_id, succession_type ORDER BY created_at) AS rn
  FROM position_successors
)
UPDATE position_successors ps
SET rank = r.rn
FROM ranked r
WHERE ps.position_id = r.position_id
  AND ps.successor_id = r.successor_id
  AND ps.succession_type = r.succession_type;

ALTER TABLE position_successors ALTER COLUMN rank SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1C: Add officer fields (parent_agency, current_agency, leadership_potential)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE officers ADD COLUMN IF NOT EXISTS parent_agency varchar;
ALTER TABLE officers ADD COLUMN IF NOT EXISTS current_agency varchar;
ALTER TABLE officers ADD COLUMN IF NOT EXISTS leadership_potential varchar;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1D: Expand service_scheme CHECK to include 'AO'
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE officers DROP CONSTRAINT IF EXISTS officers_service_scheme_check;
ALTER TABLE officers ADD CONSTRAINT officers_service_scheme_check
  CHECK (service_scheme IN ('SPSL', 'PSL', 'AO'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1E: Create officer_posting_history table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS officer_posting_history (
  posting_id serial PRIMARY KEY,
  officer_id varchar NOT NULL REFERENCES officers(officer_id) ON DELETE CASCADE,
  position_title varchar NOT NULL,
  agency varchar NOT NULL,
  start_date date NOT NULL,
  end_date date,
  grade_at_time varchar,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE officer_posting_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_posting_history_officer ON officer_posting_history(officer_id);
CREATE INDEX IF NOT EXISTS idx_posting_history_dates ON officer_posting_history(start_date DESC);

COMMIT;
