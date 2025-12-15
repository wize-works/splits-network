-- Phase 3: Automation Framework
-- Rule-based automations with human approval guardrails

-- Automation rules (configurable workflows)
CREATE TABLE IF NOT EXISTS platform.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL, -- stage_transition, notification, payout_trigger, assignment, etc.
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, disabled
    
    -- Rule definition
    trigger_conditions JSONB NOT NULL, -- When to trigger (e.g., {"stage": "offer", "duration_hours": 24})
    actions JSONB NOT NULL, -- What to do (array of actions)
    
    -- Safety guardrails
    requires_human_approval BOOLEAN DEFAULT TRUE,
    max_executions_per_day INTEGER, -- Rate limiting
    
    -- Execution stats
    times_triggered INTEGER DEFAULT 0,
    times_executed INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_executed_at TIMESTAMPTZ,
    
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_rule_status CHECK (status IN ('active', 'paused', 'disabled'))
);

-- Automation executions (audit trail of what was done)
CREATE TABLE IF NOT EXISTS platform.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES platform.automation_rules(id),
    
    -- Context
    entity_type TEXT NOT NULL, -- application, placement, recruiter, etc.
    entity_id TEXT NOT NULL,
    trigger_data JSONB,
    
    -- Execution
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, executed, failed, rejected
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    error_message TEXT,
    
    -- Approval (if required)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'approved', 'executed', 'failed', 'rejected'))
);

-- Decision audit logs (AI + human decisions)
CREATE TABLE IF NOT EXISTS platform.decision_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_type TEXT NOT NULL, -- ai_suggestion_accepted, automation_triggered, fraud_flag_raised, etc.
    entity_type TEXT NOT NULL, -- placement, application, recruiter, etc.
    entity_id TEXT NOT NULL,
    
    decision_data JSONB NOT NULL, -- Full context of the decision
    
    -- AI involvement
    ai_confidence_score DECIMAL(5, 2), -- 0-100
    ai_reasoning TEXT[],
    
    -- Human involvement
    human_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    
    created_by TEXT, -- User ID or 'system' for automated decisions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI candidate-role match suggestions
CREATE TABLE IF NOT EXISTS platform.candidate_role_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL,
    job_id UUID NOT NULL,
    
    match_score DECIMAL(5, 2) NOT NULL, -- 0-100
    match_reasons TEXT[] NOT NULL, -- Explainable factors
    
    suggested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suggested_by TEXT NOT NULL DEFAULT 'system', -- 'system' or user ID
    
    -- Human review
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    accepted BOOLEAN,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_match_score CHECK (match_score >= 0 AND match_score <= 100)
);

-- Fraud detection signals
CREATE TABLE IF NOT EXISTS platform.fraud_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_type TEXT NOT NULL, -- duplicate_submission, suspicious_pattern, velocity_anomaly, etc.
    severity TEXT NOT NULL, -- low, medium, high, critical
    status TEXT NOT NULL DEFAULT 'active', -- active, resolved, false_positive
    
    -- Affected entities
    recruiter_id TEXT,
    job_id TEXT,
    candidate_id TEXT,
    application_id TEXT,
    placement_id TEXT,
    
    -- Signal details
    signal_data JSONB NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL, -- 0-100
    
    -- Resolution
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    action_taken TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_signal_status CHECK (status IN ('active', 'resolved', 'false_positive')),
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 100)
);

-- Marketplace health metrics (aggregated views)
CREATE TABLE IF NOT EXISTS platform.marketplace_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    
    -- Activity metrics
    active_recruiters INTEGER DEFAULT 0,
    active_companies INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_applications INTEGER DEFAULT 0,
    total_placements INTEGER DEFAULT 0,
    avg_time_to_hire_days DECIMAL(10, 2),
    
    -- Quality metrics
    hire_rate DECIMAL(5, 2), -- %
    placement_completion_rate DECIMAL(5, 2), -- %
    avg_recruiter_response_time_hours DECIMAL(10, 2),
    
    -- Financial metrics
    total_fees_generated DECIMAL(12, 2),
    total_payouts_processed DECIMAL(12, 2),
    
    -- Health indicators
    fraud_signals_raised INTEGER DEFAULT 0,
    disputes_opened INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(metric_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON platform.automation_rules(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON platform.automation_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON platform.automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON platform.automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_entity ON platform.automation_executions(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_decision_audit_entity ON platform.decision_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_decision_audit_type ON platform.decision_audit_log(decision_type);
CREATE INDEX IF NOT EXISTS idx_decision_audit_created_at ON platform.decision_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_matches_candidate ON platform.candidate_role_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_job ON platform.candidate_role_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_score ON platform.candidate_role_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_matches_reviewed ON platform.candidate_role_matches(reviewed_at) WHERE reviewed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fraud_signals_status ON platform.fraud_signals(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_fraud_signals_severity ON platform.fraud_signals(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_recruiter ON platform.fraud_signals(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_created_at ON platform.fraud_signals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_metrics_date ON platform.marketplace_metrics_daily(metric_date DESC);
