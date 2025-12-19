-- Rollback 013: Remove Candidate Application Workflow Support
-- Reverts changes from 013_candidate_application_workflow.sql
-- Created: December 19, 2025

BEGIN;

-- =============================================================================
-- 1. Drop indexes
-- =============================================================================

DROP INDEX IF EXISTS ats.idx_applications_recruiter_review;
DROP INDEX IF EXISTS ats.idx_applications_draft;

-- =============================================================================
-- 2. Remove recruiter_notes column
-- =============================================================================

ALTER TABLE ats.applications DROP COLUMN IF EXISTS recruiter_notes;

-- =============================================================================
-- 3. Restore original stage constraint (without 'draft')
-- =============================================================================

ALTER TABLE ats.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
ALTER TABLE ats.applications ADD CONSTRAINT applications_stage_check
    CHECK (stage IN ('screen', 'submitted', 'interview', 'offer', 'hired', 'rejected'));

-- =============================================================================
-- 4. Drop job_pre_screen_answers table
-- =============================================================================

DROP TABLE IF EXISTS ats.job_pre_screen_answers CASCADE;

COMMIT;

-- =============================================================================
-- Rollback Complete
-- =============================================================================

-- Note: This rollback will:
-- - Delete all pre-screen answer data
-- - Remove recruiter notes from all applications
-- - Remove the 'draft' stage (any draft applications will need manual cleanup)
-- - Drop workflow-specific indexes
