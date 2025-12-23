-- Migration: Add recruiter_proposed stage for recruiter submission flow
-- Description: Adds new 'recruiter_proposed' stage to application workflow
-- Date: 2025-12-22
-- Phase: 1 - Recruiter Submission Flow with Candidate Approval

-- ============================================================================
-- Overview
-- ============================================================================
-- This migration adds support for the recruiter submission flow where:
-- 1. Recruiter proposes a job to a candidate (stage: 'recruiter_proposed')
-- 2. Candidate approves or declines (moves to 'draft' or 'rejected')
-- 3. Candidate completes application if approved
-- 4. Recruiter reviews and submits to company (existing flow continues)
--
-- Key design: No new fields needed in applications table
-- - Stage alone distinguishes recruiter-proposed from candidate-initiated draft
-- - All approval/decline events tracked in application_audit_log (no new fields)

-- ============================================================================
-- Part 1: Update Application Stages Documentation
-- ============================================================================

-- The application.stage column already supports VARCHAR, so no enum change needed.
-- Valid stages after this migration:
--   - 'recruiter_proposed' (NEW) - Recruiter has sent job, awaiting candidate decision
--   - 'draft'              - Candidate is completing application (from recruiter-proposed or self-initiated)
--   - 'ai_review'          - AI is analyzing fit
--   - 'screen'             - Recruiter conducting phone screen (represented candidates only)
--   - 'submitted'          - Submitted to company
--   - 'interview'          - Company is interviewing
--   - 'offer'              - Offer extended
--   - 'hired'              - Offer accepted, placement created
--   - 'rejected'           - Declined by company, candidate, or candidate declined recruiter proposal
--   - 'withdrawn'          - Candidate withdrew

-- Add comment to applications table about new stage
COMMENT ON COLUMN ats.applications.stage IS 
'Application stage in workflow. Valid values: recruiter_proposed, draft, ai_review, screen, submitted, interview, offer, hired, rejected, withdrawn. 
recruiter_proposed = Recruiter sent job to candidate, awaiting their decision. 
draft = Candidate is completing application. 
screen = Recruiter reviewing before company submission (represented candidates only).
Other stages represent progression through hiring pipeline.';

-- ============================================================================
-- Part 2: Update application_audit_log with new action types
-- ============================================================================

-- No schema changes needed - application_audit_log already supports arbitrary actions.
-- New action values that this migration enables:
--   - 'recruiter_proposed_job'       - Recruiter sent job to candidate
--   - 'candidate_approved_opportunity' - Candidate approved job opportunity
--   - 'candidate_declined_opportunity' - Candidate declined job opportunity
--   - 'candidate_submitted_application' - Candidate submitted completed application
--
-- All use existing columns:
--   - action: VARCHAR(100) - stores action name
--   - performed_by_user_id: UUID - identity.users.id
--   - performed_by_role: VARCHAR(50) - 'recruiter', 'candidate', 'system', etc.
--   - timestamp: TIMESTAMPTZ - when action occurred
--   - old_value: JSONB - previous state
--   - new_value: JSONB - new state
--   - notes: TEXT - additional context

-- Add comment documenting the new actions
COMMENT ON TABLE ats.application_audit_log IS 
'Audit log for all application state changes and events. Tracks all actions with actor, timestamp, and state changes.
New recruiter submission flow actions:
- recruiter_proposed_job: Recruiter sent job opportunity to candidate
- candidate_approved_opportunity: Candidate approved job opportunity and will complete application
- candidate_declined_opportunity: Candidate declined job opportunity
- candidate_submitted_application: Candidate submitted completed application (from recruiter-proposed flow)
Use new_value.decline_reason for decline actions to categorize reason.';

-- ============================================================================
-- Part 3: Ensure application_audit_log exists and has correct structure
-- ============================================================================

-- Verify the table exists (should already exist from earlier migrations)
-- If it doesn''t exist, create it here
CREATE TABLE IF NOT EXISTS ats.application_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by_user_id UUID, -- NULL for system actions
    performed_by_role VARCHAR(50), -- 'recruiter', 'candidate', 'company', 'system', etc.
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_value JSONB,
    new_value JSONB,
    notes TEXT,
    metadata JSONB, -- Additional context
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure indexes exist for query performance
CREATE INDEX IF NOT EXISTS idx_application_audit_log_application_id 
    ON ats.application_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_action 
    ON ats.application_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_timestamp 
    ON ats.application_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_performed_by_user_id 
    ON ats.application_audit_log(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_log_performed_by_role 
    ON ats.application_audit_log(performed_by_role);

-- ============================================================================
-- Part 4: Add helper function to get application stage transitions
-- ============================================================================

CREATE OR REPLACE FUNCTION ats.get_application_stage_history(p_application_id UUID)
RETURNS TABLE (
    action VARCHAR,
    from_stage VARCHAR,
    to_stage VARCHAR,
    performed_by_role VARCHAR,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.action,
        (al.old_value->>'stage')::VARCHAR AS from_stage,
        (al.new_value->>'stage')::VARCHAR AS to_stage,
        al.performed_by_role,
        al.timestamp
    FROM ats.application_audit_log al
    WHERE al.application_id = p_application_id
        AND (al.old_value->>'stage' IS NOT NULL OR al.new_value->>'stage' IS NOT NULL)
    ORDER BY al.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Part 5: Add helper function to check if application is from recruiter proposal
-- ============================================================================

CREATE OR REPLACE FUNCTION ats.is_recruiter_proposed_application(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_proposal_action BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM ats.application_audit_log
        WHERE application_id = p_application_id
            AND action = 'recruiter_proposed_job'
        LIMIT 1
    ) INTO v_has_proposal_action;
    
    RETURN v_has_proposal_action;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Part 6: Permissions (adjust role names as needed)
-- ============================================================================

-- Grant permissions on new functions
-- GRANT EXECUTE ON FUNCTION ats.get_application_stage_history TO ats_service_role;
-- GRANT EXECUTE ON FUNCTION ats.is_recruiter_proposed_application TO ats_service_role;

-- ============================================================================
-- Part 7: Data Verification (optional - run after migration)
-- ============================================================================

-- Query to check current stage distribution (should not include recruiter_proposed yet)
-- SELECT stage, COUNT(*) as count FROM ats.applications GROUP BY stage;

-- Query to check audit log is working
-- SELECT DISTINCT action FROM ats.application_audit_log ORDER BY action;

-- ============================================================================
-- Rollback Script
-- ============================================================================

/*
-- To rollback this migration:
-- 1. Drop the new functions (they can be safely dropped as they're new)
DROP FUNCTION IF EXISTS ats.is_recruiter_proposed_application(UUID);
DROP FUNCTION IF EXISTS ats.get_application_stage_history(UUID);

-- 2. Update column comment (optional)
COMMENT ON COLUMN ats.applications.stage IS 'Application stage in workflow';

-- 3. That's it - no data or indexes to remove as we didn't add any columns
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration adds support for the recruiter_proposed stage with no schema
-- changes needed - the existing VARCHAR stage column and application_audit_log
-- table support all new functionality.
--
-- Next steps:
-- 1. Update ApplicationService to handle new methods
-- 2. Update application routes with new endpoints
-- 3. Update notification service with new templates
-- 4. Update portal UIs (candidate and recruiter)
