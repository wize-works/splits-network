-- Migration: Create AI Reviews table and update application stages
-- Description: Add AI-assisted application screening with ai_review stage
-- Date: 2025-12-21
-- Phase: 1.5 - AI-Assisted Application Flow

-- ============================================================================
-- Part 1: Create ai_reviews table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ats.ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    
    -- AI Analysis Results
    fit_score INTEGER NOT NULL CHECK (fit_score >= 0 AND fit_score <= 100),
    recommendation VARCHAR(50) NOT NULL CHECK (recommendation IN ('strong_fit', 'good_fit', 'fair_fit', 'poor_fit')),
    overall_summary TEXT NOT NULL,
    confidence_level INTEGER NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Detailed Analysis
    strengths TEXT[] NOT NULL DEFAULT '{}',
    concerns TEXT[] NOT NULL DEFAULT '{}',
    matched_skills TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    skills_match_percentage INTEGER CHECK (skills_match_percentage >= 0 AND skills_match_percentage <= 100),
    
    -- Experience Analysis
    required_years INTEGER,
    candidate_years DECIMAL(4,1),
    meets_experience_requirement BOOLEAN,
    
    -- Location
    location_compatibility VARCHAR(50) CHECK (location_compatibility IN ('perfect', 'good', 'challenging', 'mismatch')),
    
    -- Metadata
    model_version VARCHAR(100) NOT NULL,
    processing_time_ms INTEGER, -- How long AI took
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one review per application
    UNIQUE(application_id)
);

-- Create indexes for performance
CREATE INDEX idx_ai_reviews_application_id ON ats.ai_reviews(application_id);
CREATE INDEX idx_ai_reviews_fit_score ON ats.ai_reviews(fit_score);
CREATE INDEX idx_ai_reviews_recommendation ON ats.ai_reviews(recommendation);
CREATE INDEX idx_ai_reviews_analyzed_at ON ats.ai_reviews(analyzed_at);

-- Add comment
COMMENT ON TABLE ats.ai_reviews IS 'AI-generated analysis of candidate-job fit for applications';
COMMENT ON COLUMN ats.ai_reviews.fit_score IS 'AI fit score from 0-100, higher is better match';
COMMENT ON COLUMN ats.ai_reviews.recommendation IS 'AI recommendation category: strong_fit, good_fit, fair_fit, poor_fit';
COMMENT ON COLUMN ats.ai_reviews.confidence_level IS 'AI confidence in analysis from 0-100';

-- ============================================================================
-- Part 2: Add ai_reviewed column to applications table
-- ============================================================================

-- Add column to track whether AI review has been completed
ALTER TABLE ats.applications 
ADD COLUMN IF NOT EXISTS ai_reviewed BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_applications_ai_reviewed ON ats.applications(ai_reviewed);

-- Add comment
COMMENT ON COLUMN ats.applications.ai_reviewed IS 'Whether AI review has been completed for this application';

-- ============================================================================
-- Part 3: Update application stage enum (handled in application code)
-- ============================================================================

-- Note: PostgreSQL doesn't use native ENUMs for this table
-- The application stage is stored as VARCHAR and validated in application code
-- New valid stages after this migration:
--   - 'draft'       (existing)
--   - 'ai_review'   (NEW)
--   - 'screen'      (NEW - phone screen by recruiter)
--   - 'submitted'   (existing)
--   - 'interview'   (existing)
--   - 'offer'       (existing)
--   - 'hired'       (existing)
--   - 'rejected'    (existing)
--   - 'withdrawn'   (existing)

-- ============================================================================
-- Part 4: Grant permissions
-- ============================================================================

-- Assuming service role exists (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ats.ai_reviews TO ats_service_role;
-- GRANT USAGE, SELECT ON SEQUENCE ats.ai_reviews_id_seq TO ats_service_role;

-- ============================================================================
-- Rollback script (create 018_create_ai_reviews_table_rollback.sql if needed)
-- ============================================================================

/*
-- To rollback this migration:

-- Drop indexes
DROP INDEX IF EXISTS ats.idx_applications_ai_reviewed;
DROP INDEX IF EXISTS ats.idx_ai_reviews_analyzed_at;
DROP INDEX IF EXISTS ats.idx_ai_reviews_recommendation;
DROP INDEX IF EXISTS ats.idx_ai_reviews_fit_score;
DROP INDEX IF EXISTS ats.idx_ai_reviews_application_id;

-- Drop column
ALTER TABLE ats.applications DROP COLUMN IF EXISTS ai_reviewed;

-- Drop table
DROP TABLE IF EXISTS ats.ai_reviews;
*/
