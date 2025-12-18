-- Migration: User Consent Tracking
-- Purpose: Store cookie consent and privacy preferences for GDPR/CCPA compliance
-- Schema: identity
-- Created: 2025-12-18

-- Create user_consent table
CREATE TABLE IF NOT EXISTS identity.user_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    
    -- Consent categories
    necessary BOOLEAN NOT NULL DEFAULT TRUE,
    functional BOOLEAN NOT NULL DEFAULT FALSE,
    analytics BOOLEAN NOT NULL DEFAULT FALSE,
    marketing BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit information
    ip_address INET,
    user_agent TEXT,
    consent_source VARCHAR(50) DEFAULT 'web', -- 'web', 'mobile', 'api'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one active consent record per user
    CONSTRAINT one_consent_per_user UNIQUE (user_id)
);

-- Index for quick user lookups
CREATE INDEX idx_user_consent_user_id ON identity.user_consent(user_id);

-- Index for compliance reporting (find consents by date)
CREATE INDEX idx_user_consent_created_at ON identity.user_consent(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION identity.update_user_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_consent_timestamp
    BEFORE UPDATE ON identity.user_consent
    FOR EACH ROW
    EXECUTE FUNCTION identity.update_user_consent_timestamp();

-- Grant permissions (adjust based on your service accounts)
GRANT SELECT, INSERT, UPDATE ON identity.user_consent TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA identity TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE identity.user_consent IS 'Stores user cookie and privacy consent preferences for GDPR/CCPA compliance';
COMMENT ON COLUMN identity.user_consent.necessary IS 'Always true - required for site functionality';
COMMENT ON COLUMN identity.user_consent.functional IS 'User consent for functional/preference cookies';
COMMENT ON COLUMN identity.user_consent.analytics IS 'User consent for analytics/performance cookies';
COMMENT ON COLUMN identity.user_consent.marketing IS 'User consent for marketing/advertising cookies';
