-- Migration 013: Add Candidate Application Workflow Support
-- Adds pre-screen answers table and updates applications stage values
-- Created: December 19, 2025

BEGIN;

-- =============================================================================
-- 1. Create job_pre_screen_answers table
-- =============================================================================

CREATE TABLE IF NOT EXISTS ats.job_pre_screen_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ats.job_pre_screen_questions(id) ON DELETE CASCADE,
    
    -- Generic answer storage (aligns with question_type pattern)
    answer JSONB NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one answer per question per application
    UNIQUE(application_id, question_id)
);

-- Indexes for job_pre_screen_answers
CREATE INDEX idx_pre_screen_answers_application ON ats.job_pre_screen_answers(application_id);
CREATE INDEX idx_pre_screen_answers_question ON ats.job_pre_screen_answers(question_id);

-- Comments
COMMENT ON TABLE ats.job_pre_screen_answers IS 'Candidate responses to job pre-screening questions';
COMMENT ON COLUMN ats.job_pre_screen_answers.answer IS 'JSONB answer matching question_type format from job_pre_screen_questions';

-- =============================================================================
-- 2. Add 'draft' stage to applications
-- =============================================================================

-- Drop existing stage constraint if it exists
ALTER TABLE ats.applications DROP CONSTRAINT IF EXISTS applications_stage_check;

-- Add new constraint with 'draft' stage
ALTER TABLE ats.applications ADD CONSTRAINT applications_stage_check
    CHECK (stage IN ('draft', 'screen', 'submitted', 'interview', 'offer', 'hired', 'rejected'));

-- =============================================================================
-- 3. Add recruiter_notes column if it doesn't exist
-- =============================================================================

ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

COMMENT ON COLUMN ats.applications.recruiter_notes IS 'Recruiter insights/pitch added during review before submitting to company';

-- =============================================================================
-- 4. Add indexes for application workflow queries
-- =============================================================================

-- Index for draft applications by candidate
CREATE INDEX IF NOT EXISTS idx_applications_draft 
    ON ats.applications(candidate_id, stage) 
    WHERE stage = 'draft';

-- Index for applications pending recruiter review
CREATE INDEX IF NOT EXISTS idx_applications_recruiter_review 
    ON ats.applications(recruiter_id, stage) 
    WHERE stage = 'screen';

COMMIT;

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Next Steps:
-- 1. Verify tables with: \d ats.job_pre_screen_answers
-- 2. Check stage constraint: SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'applications_stage_check';
-- 3. Verify indexes: \di ats.idx_applications_*
-- 4. Run validation queries from docs/implementation/01-database-schema.md
