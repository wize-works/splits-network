-- ============================================================================
-- Migration 015: Enforce Single Active Recruiter Per Candidate
-- ============================================================================
-- Business Rule: A candidate can only have ONE active recruiter relationship
-- at any given time. This ensures exclusive 12-month representation periods.
-- Historical relationships (expired/terminated) are preserved for financial
-- attribution and tracking.
-- ============================================================================

BEGIN;

-- Create partial unique index to enforce one active recruiter per candidate
-- This allows multiple historical relationships but only one active
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_recruiter_per_candidate 
ON network.recruiter_candidates(candidate_id) 
WHERE status = 'active';

COMMENT ON INDEX network.unique_active_recruiter_per_candidate IS 
'Ensures a candidate can only have one active recruiter relationship at a time. Historical relationships (expired/terminated) are preserved for financial tracking.';

-- Add helpful comment to the table
COMMENT ON TABLE network.recruiter_candidates IS 
'Tracks 12-month renewable exclusive relationships between recruiters and candidates. A candidate can only have ONE active relationship at a time, but historical relationships are preserved for financial attribution.';

COMMIT;
