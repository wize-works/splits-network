-- Phase 2: Candidate Ownership & Sourcing
-- This migration adds ownership tracking, sourcer attribution, state machines, and reputation signals

-- ============================================================================
-- 1. Candidate Ownership & Sourcing
-- ============================================================================

-- Track who sourced each candidate and when
CREATE TABLE IF NOT EXISTS ats.candidate_sourcers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES ats.candidates(id) ON DELETE CASCADE,
    sourcer_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    sourcer_type TEXT NOT NULL CHECK (sourcer_type IN ('recruiter', 'tsn')),
    sourced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    protection_window_days INTEGER NOT NULL DEFAULT 365,
    protection_expires_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Only one sourcer per candidate
    UNIQUE(candidate_id)
);

CREATE INDEX idx_candidate_sourcers_candidate ON ats.candidate_sourcers(candidate_id);
CREATE INDEX idx_candidate_sourcers_sourcer ON ats.candidate_sourcers(sourcer_user_id);
CREATE INDEX idx_candidate_sourcers_expires ON ats.candidate_sourcers(protection_expires_at);

COMMENT ON TABLE ats.candidate_sourcers IS 'Tracks who first sourced each candidate and protection windows';
COMMENT ON COLUMN ats.candidate_sourcers.sourcer_type IS 'Who sourced: recruiter or tsn (The Splits Network)';
COMMENT ON COLUMN ats.candidate_sourcers.protection_window_days IS 'How long the sourcer has attribution rights';

-- ============================================================================
-- 2. CandidateRoleAssignment State Machine
-- ============================================================================

-- Replace simple role_assignments with a state machine for candidate-job proposals
CREATE TABLE IF NOT EXISTS network.candidate_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ats.jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES ats.candidates(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES network.recruiters(id) ON DELETE CASCADE,
    
    -- State machine
    state TEXT NOT NULL DEFAULT 'proposed' CHECK (state IN (
        'proposed',    -- Recruiter proposes to work on this candidate-role pairing
        'accepted',    -- Company accepted
        'declined',    -- Company declined
        'timed_out',   -- No response within timeout window
        'submitted',   -- Application submitted
        'closed'       -- Final state (hired, rejected, or withdrawn)
    )),
    
    -- Timestamps for state transitions
    proposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_due_at TIMESTAMPTZ NOT NULL, -- Timeout deadline
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    timed_out_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Metadata
    proposed_by UUID REFERENCES identity.users(id),
    proposal_notes TEXT,
    response_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent duplicate proposals for same candidate-job pair
    UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_cra_job ON network.candidate_role_assignments(job_id);
CREATE INDEX idx_cra_candidate ON network.candidate_role_assignments(candidate_id);
CREATE INDEX idx_cra_recruiter ON network.candidate_role_assignments(recruiter_id);
CREATE INDEX idx_cra_state ON network.candidate_role_assignments(state);
CREATE INDEX idx_cra_response_due ON network.candidate_role_assignments(response_due_at);

COMMENT ON TABLE network.candidate_role_assignments IS 'State machine for candidate-job proposals and collaboration';
COMMENT ON COLUMN network.candidate_role_assignments.state IS 'Current state in proposal lifecycle';
COMMENT ON COLUMN network.candidate_role_assignments.response_due_at IS 'When the proposal times out if no response';

-- ============================================================================
-- 3. Multi-Recruiter Placements & Splits
-- ============================================================================

-- Extend placements table for Phase 2 lifecycle and guarantees
ALTER TABLE ats.placements 
    ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'hired' 
        CHECK (state IN ('hired', 'active', 'completed', 'failed')),
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS guarantee_days INTEGER NOT NULL DEFAULT 90,
    ADD COLUMN IF NOT EXISTS guarantee_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS replacement_placement_id UUID REFERENCES ats.placements(id);

CREATE INDEX idx_placements_state ON ats.placements(state);
CREATE INDEX idx_placements_guarantee_expires ON ats.placements(guarantee_expires_at);

COMMENT ON COLUMN ats.placements.state IS 'Placement lifecycle: hired -> active -> completed or failed';
COMMENT ON COLUMN ats.placements.guarantee_days IS 'Guarantee period in days (default 90)';
COMMENT ON COLUMN ats.placements.replacement_placement_id IS 'If this placement replaced a failed one';

-- Track multiple recruiters per placement with explicit split percentages
CREATE TABLE IF NOT EXISTS ats.placement_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES ats.placements(id) ON DELETE CASCADE,
    recruiter_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('sourcer', 'submitter', 'closer', 'support')),
    split_percentage NUMERIC NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
    split_amount NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Prevent duplicate roles per recruiter on same placement
    UNIQUE(placement_id, recruiter_user_id, role)
);

CREATE INDEX idx_placement_collaborators_placement ON ats.placement_collaborators(placement_id);
CREATE INDEX idx_placement_collaborators_recruiter ON ats.placement_collaborators(recruiter_user_id);

COMMENT ON TABLE ats.placement_collaborators IS 'Multiple recruiters can collaborate on a placement with explicit splits';
COMMENT ON COLUMN ats.placement_collaborators.role IS 'What this recruiter contributed';
COMMENT ON COLUMN ats.placement_collaborators.split_percentage IS 'Their share of the recruiter portion';

-- ============================================================================
-- 4. Reputation System
-- ============================================================================

-- Aggregate reputation signals for recruiters
CREATE TABLE IF NOT EXISTS network.recruiter_reputation (
    recruiter_id UUID PRIMARY KEY REFERENCES network.recruiters(id) ON DELETE CASCADE,
    
    -- Submission metrics
    total_submissions INTEGER NOT NULL DEFAULT 0,
    total_hires INTEGER NOT NULL DEFAULT 0,
    hire_rate NUMERIC, -- Calculated: hires / submissions
    
    -- Quality metrics
    total_placements INTEGER NOT NULL DEFAULT 0,
    completed_placements INTEGER NOT NULL DEFAULT 0,
    failed_placements INTEGER NOT NULL DEFAULT 0,
    completion_rate NUMERIC, -- Calculated: completed / total
    
    -- Collaboration metrics
    total_collaborations INTEGER NOT NULL DEFAULT 0,
    collaboration_rate NUMERIC, -- Calculated: collaborations / placements
    
    -- Responsiveness metrics  
    avg_response_time_hours NUMERIC,
    proposals_accepted INTEGER NOT NULL DEFAULT 0,
    proposals_declined INTEGER NOT NULL DEFAULT 0,
    proposals_timed_out INTEGER NOT NULL DEFAULT 0,
    
    -- Overall score (0-100)
    reputation_score NUMERIC DEFAULT 50.0 CHECK (reputation_score >= 0 AND reputation_score <= 100),
    
    -- Timestamps
    last_calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recruiter_reputation_score ON network.recruiter_reputation(reputation_score DESC);
CREATE INDEX idx_recruiter_reputation_hire_rate ON network.recruiter_reputation(hire_rate DESC);

COMMENT ON TABLE network.recruiter_reputation IS 'Aggregated reputation metrics for each recruiter';
COMMENT ON COLUMN network.recruiter_reputation.reputation_score IS 'Overall quality score (0-100) derived from outcomes';

-- ============================================================================
-- 5. Outreach Tracking
-- ============================================================================

-- Track outreach to candidates (establishes ownership)
CREATE TABLE IF NOT EXISTS ats.candidate_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES ats.candidates(id) ON DELETE CASCADE,
    recruiter_user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES ats.jobs(id) ON DELETE SET NULL,
    
    -- Outreach details
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    
    -- Tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    bounced BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outreach_candidate ON ats.candidate_outreach(candidate_id);
CREATE INDEX idx_outreach_recruiter ON ats.candidate_outreach(recruiter_user_id);
CREATE INDEX idx_outreach_job ON ats.candidate_outreach(job_id);
CREATE INDEX idx_outreach_sent ON ats.candidate_outreach(sent_at DESC);

COMMENT ON TABLE ats.candidate_outreach IS 'Tracks all outreach emails sent to candidates via Resend';
COMMENT ON COLUMN ats.candidate_outreach.sent_at IS 'First outreach establishes ownership';

-- ============================================================================
-- 6. Events Log (for analytics and auditing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS network.marketplace_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    user_id UUID REFERENCES identity.users(id),
    recruiter_id UUID REFERENCES network.recruiters(id),
    job_id UUID REFERENCES ats.jobs(id),
    candidate_id UUID REFERENCES ats.candidates(id),
    placement_id UUID REFERENCES ats.placements(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_events_type ON network.marketplace_events(event_type);
CREATE INDEX idx_marketplace_events_user ON network.marketplace_events(user_id);
CREATE INDEX idx_marketplace_events_recruiter ON network.marketplace_events(recruiter_id);
CREATE INDEX idx_marketplace_events_created ON network.marketplace_events(created_at DESC);

COMMENT ON TABLE network.marketplace_events IS 'Event log for marketplace actions (analytics and audit trail)';

-- ============================================================================
-- 7. Triggers for automatic reputation updates
-- ============================================================================

-- Function to initialize reputation when recruiter is created
CREATE OR REPLACE FUNCTION network.initialize_recruiter_reputation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO network.recruiter_reputation (recruiter_id)
    VALUES (NEW.id)
    ON CONFLICT (recruiter_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_reputation
    AFTER INSERT ON network.recruiters
    FOR EACH ROW
    EXECUTE FUNCTION network.initialize_recruiter_reputation();

-- ============================================================================
-- 8. Computed fields and helper functions
-- ============================================================================

-- Function to calculate protection expiry
CREATE OR REPLACE FUNCTION ats.calculate_protection_expiry(
    sourced_at TIMESTAMPTZ,
    protection_days INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN sourced_at + (protection_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if candidate is protected for a recruiter
CREATE OR REPLACE FUNCTION ats.is_candidate_protected(
    p_candidate_id UUID,
    p_recruiter_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_sourcer_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    SELECT sourcer_user_id, protection_expires_at
    INTO v_sourcer_id, v_expires_at
    FROM ats.candidate_sourcers
    WHERE candidate_id = p_candidate_id;
    
    -- If no sourcer, candidate is not protected
    IF v_sourcer_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If protection expired, candidate is not protected
    IF v_expires_at < now() THEN
        RETURN FALSE;
    END IF;
    
    -- If this recruiter is the sourcer, they have rights
    IF v_sourcer_id = p_recruiter_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise, protected from this recruiter
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ats.is_candidate_protected IS 'Check if a candidate is protected (and by whom)';
