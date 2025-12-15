-- Phase 3: Add Stripe Connect account tracking to recruiters
-- Allows recruiters to receive automated payouts

ALTER TABLE network.recruiters 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recruiters_stripe_account 
ON network.recruiters(stripe_connect_account_id) 
WHERE stripe_connect_account_id IS NOT NULL;
