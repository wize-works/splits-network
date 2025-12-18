-- ============================================================================
-- Migration: Add Consent Tracking to Recruiter-Candidate Relationships
-- ============================================================================
-- This migration adds consent and right-to-represent tracking for when
-- recruiters invite candidates to the Applicant Network
-- ============================================================================

-- Add consent tracking fields to network.recruiter_candidates
ALTER TABLE network.recruiter_candidates
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS invitation_token TEXT,
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_ip_address TEXT,
ADD COLUMN IF NOT EXISTS consent_user_agent TEXT,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_reason TEXT;

-- Add index for finding invitations by token
CREATE INDEX IF NOT EXISTS idx_recruiter_candidates_invitation_token 
ON network.recruiter_candidates(invitation_token) 
WHERE invitation_token IS NOT NULL;

-- Add index for filtering by consent status
CREATE INDEX IF NOT EXISTS idx_recruiter_candidates_consent 
ON network.recruiter_candidates(consent_given, invited_at DESC);

-- Comments
COMMENT ON COLUMN network.recruiter_candidates.invited_at IS 'When the recruiter invited the candidate to the Applicant Network';
COMMENT ON COLUMN network.recruiter_candidates.invitation_token IS 'Secure token for magic link authentication (expires after 7 days or on acceptance)';
COMMENT ON COLUMN network.recruiter_candidates.invitation_expires_at IS 'When the invitation token expires (typically 7 days from invited_at)';
COMMENT ON COLUMN network.recruiter_candidates.consent_given IS 'Whether candidate accepted right to represent agreement';
COMMENT ON COLUMN network.recruiter_candidates.consent_given_at IS 'Timestamp when candidate accepted the agreement';
COMMENT ON COLUMN network.recruiter_candidates.consent_ip_address IS 'IP address when consent was given (for legal compliance)';
COMMENT ON COLUMN network.recruiter_candidates.consent_user_agent IS 'User agent when consent was given (for legal compliance)';
COMMENT ON COLUMN network.recruiter_candidates.declined_at IS 'When candidate declined the invitation';
COMMENT ON COLUMN network.recruiter_candidates.declined_reason IS 'Optional reason why candidate declined';

-- Update existing records to have invited_at set to created_at
UPDATE network.recruiter_candidates 
SET invited_at = created_at 
WHERE invited_at IS NULL;
