-- Phase 3: Payout System
-- Creates tables for automated payouts after guarantee completion

-- Payout records (immutable after creation)
CREATE TABLE IF NOT EXISTS billing.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES ats.placements(id),
    recruiter_id UUID NOT NULL REFERENCES network.recruiters(id),
    
    -- Amounts
    placement_fee DECIMAL(12, 2) NOT NULL, -- Total fee for this placement
    recruiter_share_percentage DECIMAL(5, 2) NOT NULL, -- Recruiter's percentage (e.g., 100.00 or 50.00 for splits)
    payout_amount DECIMAL(12, 2) NOT NULL, -- Actual payout amount to this recruiter
    
    -- Stripe details
    stripe_transfer_id TEXT, -- Stripe Connect transfer ID
    stripe_payout_id TEXT, -- Stripe payout ID to recruiter's account
    stripe_connect_account_id TEXT, -- Recruiter's Stripe Connect account
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, reversed
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Escrow/Holdback
    holdback_amount DECIMAL(12, 2) DEFAULT 0, -- Amount held back for guarantee period
    holdback_released_at TIMESTAMPTZ, -- When holdback was released
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT, -- User or system that triggered payout
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed', 'on_hold')),
    CONSTRAINT valid_amounts CHECK (payout_amount >= 0 AND placement_fee >= 0 AND holdback_amount >= 0),
    CONSTRAINT valid_percentage CHECK (recruiter_share_percentage >= 0 AND recruiter_share_percentage <= 100)
);

-- Payout schedule (when payouts should be triggered)
CREATE TABLE IF NOT EXISTS billing.payout_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES ats.placements(id),
    
    scheduled_date DATE NOT NULL, -- When payout should be processed
    trigger_event TEXT NOT NULL, -- guarantee_complete, replacement_cleared, manual
    
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, triggered, cancelled
    triggered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_schedule_status CHECK (status IN ('scheduled', 'triggered', 'cancelled'))
);

-- Payout splits (for multi-recruiter placements in Phase 2+)
CREATE TABLE IF NOT EXISTS billing.payout_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES billing.payouts(id),
    collaborator_recruiter_id UUID NOT NULL REFERENCES network.recruiters(id),
    
    -- Split calculation
    split_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 50.00 for 50/50 split
    split_amount DECIMAL(12, 2) NOT NULL,
    
    -- Status (inherits from parent payout but tracked separately)
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_transfer_id TEXT,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_split_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_split_percentage CHECK (split_percentage > 0 AND split_percentage <= 100)
);

-- Escrow holds (amounts held pending guarantee completion)
CREATE TABLE IF NOT EXISTS billing.escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES ats.placements(id),
    payout_id UUID REFERENCES billing.payouts(id), -- Linked when payout is created
    
    hold_amount DECIMAL(12, 2) NOT NULL,
    hold_reason TEXT NOT NULL, -- guarantee_period, dispute_pending, compliance_review
    
    -- Hold period
    held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    release_scheduled_date DATE, -- When hold should be automatically released
    released_at TIMESTAMPTZ,
    released_by TEXT,
    
    status TEXT NOT NULL DEFAULT 'active', -- active, released, forfeited
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_hold_status CHECK (status IN ('active', 'released', 'forfeited'))
);

-- Payout audit log (all state changes)
CREATE TABLE IF NOT EXISTS billing.payout_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES billing.payouts(id),
    
    event_type TEXT NOT NULL, -- created, status_changed, amount_adjusted, stripe_transfer_created, etc.
    old_status TEXT,
    new_status TEXT,
    old_amount DECIMAL(12, 2),
    new_amount DECIMAL(12, 2),
    
    reason TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL -- User ID or 'system'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payouts_placement ON billing.payouts(placement_id);
CREATE INDEX IF NOT EXISTS idx_payouts_recruiter ON billing.payouts(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON billing.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON billing.payouts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payout_schedules_date ON billing.payout_schedules(scheduled_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_payout_schedules_placement ON billing.payout_schedules(placement_id);

CREATE INDEX IF NOT EXISTS idx_payout_splits_payout ON billing.payout_splits(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_splits_recruiter ON billing.payout_splits(collaborator_recruiter_id);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_placement ON billing.escrow_holds(placement_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON billing.escrow_holds(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_escrow_holds_release_date ON billing.escrow_holds(release_scheduled_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_payout_audit_payout ON billing.payout_audit_log(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_audit_created_at ON billing.payout_audit_log(created_at DESC);
