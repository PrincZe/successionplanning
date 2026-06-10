-- Migration: Add tag column to position_successors
-- Allows agency HR to manually tag successors as 'immediate' or 'contingency' (or leave blank)

ALTER TABLE position_successors
  ADD COLUMN IF NOT EXISTS tag varchar NULL;

ALTER TABLE position_successors
  ADD CONSTRAINT position_successors_tag_check
  CHECK (tag IS NULL OR tag IN ('immediate', 'contingency'));
