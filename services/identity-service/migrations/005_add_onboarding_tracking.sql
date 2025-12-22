-- Migration: Add onboarding tracking fields to identity.users table
-- Description: Adds fields to track user onboarding wizard progress and completion
-- Created: 2025-12-22

-- Add onboarding tracking columns
ALTER TABLE identity.users 
  ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_status 
  ON identity.users(onboarding_status);

-- Add comment to document the field values
COMMENT ON COLUMN identity.users.onboarding_status IS 
  'Tracks user onboarding wizard progress: pending, in_progress, completed, skipped';

COMMENT ON COLUMN identity.users.onboarding_step IS 
  'Current wizard step (1-4): 1=role selection, 2=subscription, 3=profile, 4=complete';

COMMENT ON COLUMN identity.users.onboarding_completed_at IS 
  'Timestamp when user completed the onboarding wizard';
