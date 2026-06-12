-- Migration: Always-open editing + endorsement snapshots
-- 1. Snapshot table to store endorsed plan state
-- 2. Make successor_changes.submission_id nullable for out-of-cycle edits

CREATE TABLE IF NOT EXISTS endorsed_plan_snapshots (
  snapshot_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid REFERENCES plan_submissions(submission_id),
  agency varchar NOT NULL,
  endorsed_at timestamptz NOT NULL DEFAULT now(),
  endorsed_by varchar,
  snapshot jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_agency ON endorsed_plan_snapshots(agency);

ALTER TABLE successor_changes ALTER COLUMN submission_id DROP NOT NULL;
