// Identity domain types
export interface User {
    id: string;
    clerk_user_id: string;
    email: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface Organization {
    id: string;
    name: string;
    type: 'company' | 'platform';
    created_at: Date;
    updated_at: Date;
}

export type MembershipRole = 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin';

export interface Membership {
    id: string;
    user_id: string;
    organization_id: string;
    role: MembershipRole;
    created_at: Date;
    updated_at: Date;
}

// ATS domain types
export interface Company {
    id: string;
    identity_organization_id?: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export type JobStatus = 'active' | 'paused' | 'filled' | 'closed';

export interface Job {
    id: string;
    company_id: string;
    title: string;
    department?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    fee_percentage: number;
    description?: string;
    status: JobStatus;
    created_at: Date;
    updated_at: Date;
    company?: Company;  // Enriched data from service layer
}

export interface Candidate {
    id: string;
    email: string;
    full_name: string;
    linkedin_url?: string;
    created_at: Date;
    updated_at: Date;
}

export type ApplicationStage = 'submitted' | 'screen' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    recruiter_id?: string;
    stage: ApplicationStage;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export type PlacementState = 'hired' | 'active' | 'completed' | 'failed';

export interface Placement {
    id: string;
    job_id: string;
    candidate_id: string;
    company_id: string;
    recruiter_id: string;
    application_id?: string;
    hired_at: Date;
    salary: number;
    fee_percentage: number;
    fee_amount: number;
    recruiter_share: number;
    platform_share: number;
    created_at: Date;
    updated_at: Date;
    // Phase 2: Placement lifecycle
    state?: PlacementState;
    start_date?: Date;
    end_date?: Date;
    guarantee_days?: number;
    guarantee_expires_at?: Date;
    failure_reason?: string;
    failed_at?: Date;
    replacement_placement_id?: string;
}

// Network domain types
export type RecruiterStatus = 'pending' | 'active' | 'suspended';

export interface Recruiter {
    id: string;
    user_id: string;
    status: RecruiterStatus;
    bio?: string;
    created_at: Date;
    updated_at: Date;
}

export interface RoleAssignment {
    id: string;
    job_id: string;
    recruiter_id: string;
    assigned_at: Date;
    assigned_by?: string;
}

// Billing domain types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    stripe_price_id?: string;
    features: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export interface Subscription {
    id: string;
    recruiter_id: string;
    plan_id: string;
    stripe_subscription_id?: string;
    status: SubscriptionStatus;
    current_period_start?: Date;
    current_period_end?: Date;
    cancel_at?: Date;
    created_at: Date;
    updated_at: Date;
}

// ============================================================================
// Phase 2 Types
// ============================================================================

// Candidate Ownership & Sourcing
export type SourcerType = 'recruiter' | 'tsn';

export interface CandidateSourcer {
    id: string;
    candidate_id: string;
    sourcer_user_id: string;
    sourcer_type: SourcerType;
    sourced_at: Date;
    protection_window_days: number;
    protection_expires_at: Date;
    notes?: string;
    created_at: Date;
}

// Candidate-Role Assignment State Machine
export type CandidateRoleAssignmentState = 
    | 'proposed'
    | 'accepted'
    | 'declined'
    | 'timed_out'
    | 'submitted'
    | 'closed';

export interface CandidateRoleAssignment {
    id: string;
    job_id: string;
    candidate_id: string;
    recruiter_id: string;
    state: CandidateRoleAssignmentState;
    proposed_at: Date;
    response_due_at: Date;
    accepted_at?: Date;
    declined_at?: Date;
    timed_out_at?: Date;
    submitted_at?: Date;
    closed_at?: Date;
    proposed_by?: string;
    proposal_notes?: string;
    response_notes?: string;
    created_at: Date;
    updated_at: Date;
}

// Multi-Recruiter Placements
export type CollaboratorRole = 'sourcer' | 'submitter' | 'closer' | 'support';

export interface PlacementCollaborator {
    id: string;
    placement_id: string;
    recruiter_user_id: string;
    role: CollaboratorRole;
    split_percentage: number;
    split_amount: number;
    notes?: string;
    created_at: Date;
}

// Reputation System
export interface RecruiterReputation {
    recruiter_id: string;
    total_submissions: number;
    total_hires: number;
    hire_rate?: number;
    total_placements: number;
    completed_placements: number;
    failed_placements: number;
    completion_rate?: number;
    total_collaborations: number;
    collaboration_rate?: number;
    avg_response_time_hours?: number;
    proposals_accepted: number;
    proposals_declined: number;
    proposals_timed_out: number;
    reputation_score: number; // 0-100
    last_calculated_at?: Date;
    created_at: Date;
    updated_at: Date;
}

// Outreach Tracking
export interface CandidateOutreach {
    id: string;
    candidate_id: string;
    recruiter_user_id: string;
    job_id?: string;
    sent_at: Date;
    email_subject: string;
    email_body: string;
    opened_at?: Date;
    clicked_at?: Date;
    replied_at?: Date;
    unsubscribed_at?: Date;
    bounced: boolean;
    created_at: Date;
}

// Marketplace Events Log
export interface MarketplaceEvent {
    id: string;
    event_type: string;
    event_data: Record<string, any>;
    user_id?: string;
    recruiter_id?: string;
    job_id?: string;
    candidate_id?: string;
    placement_id?: string;
    created_at: Date;
}

// ============================================================================
// Phase 3 Types - Automated Payouts & Intelligence
// ============================================================================

// Payout System
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'on_hold';

export interface Payout {
    id: string;
    placement_id: string;
    recruiter_id: string;
    
    // Amounts
    placement_fee: number;
    recruiter_share_percentage: number;
    payout_amount: number;
    
    // Stripe details
    stripe_transfer_id?: string;
    stripe_payout_id?: string;
    stripe_connect_account_id?: string;
    
    // Status tracking
    status: PayoutStatus;
    processing_started_at?: Date;
    completed_at?: Date;
    failed_at?: Date;
    failure_reason?: string;
    
    // Escrow/Holdback
    holdback_amount: number;
    holdback_released_at?: Date;
    
    // Audit
    created_at: Date;
    updated_at: Date;
    created_by?: string;
}

export type PayoutScheduleStatus = 'scheduled' | 'triggered' | 'cancelled';

export interface PayoutSchedule {
    id: string;
    placement_id: string;
    scheduled_date: Date;
    trigger_event: string; // guarantee_complete, replacement_cleared, manual
    status: PayoutScheduleStatus;
    triggered_at?: Date;
    cancelled_at?: Date;
    cancellation_reason?: string;
    created_at: Date;
    updated_at: Date;
}

export interface PayoutSplit {
    id: string;
    payout_id: string;
    collaborator_recruiter_id: string;
    split_percentage: number;
    split_amount: number;
    status: PayoutStatus;
    stripe_transfer_id?: string;
    completed_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export type EscrowHoldStatus = 'active' | 'released' | 'forfeited';

export interface EscrowHold {
    id: string;
    placement_id: string;
    payout_id?: string;
    hold_amount: number;
    hold_reason: string;
    held_at: Date;
    release_scheduled_date?: Date;
    released_at?: Date;
    released_by?: string;
    status: EscrowHoldStatus;
    created_at: Date;
    updated_at: Date;
}

export interface PayoutAuditLog {
    id: string;
    payout_id: string;
    event_type: string;
    old_status?: string;
    new_status?: string;
    old_amount?: number;
    new_amount?: number;
    reason?: string;
    metadata?: Record<string, any>;
    created_at: Date;
    created_by: string;
}

// Decision Audit System
export interface DecisionAuditLog {
    id: string;
    decision_type: string; // ai_suggestion_accepted, automation_triggered, fraud_flag_raised, etc.
    entity_type: string; // placement, application, recruiter, etc.
    entity_id: string;
    decision_data: Record<string, any>;
    ai_confidence_score?: number;
    human_override?: boolean;
    override_reason?: string;
    created_by?: string; // 'system' for automated decisions
    created_at: Date;
}

// AI Match Suggestions
export interface CandidateRoleMatch {
    id: string;
    candidate_id: string;
    job_id: string;
    match_score: number; // 0-100
    match_reason: string[]; // Explainable factors
    suggested_at: Date;
    suggested_by: 'system' | string;
    reviewed_by?: string;
    reviewed_at?: Date;
    accepted?: boolean;
    rejection_reason?: string;
    created_at: Date;
}

// Fraud Detection
export type FraudSignalSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudSignalStatus = 'active' | 'resolved' | 'false_positive';

export interface FraudSignal {
    id: string;
    signal_type: string; // duplicate_submission, suspicious_pattern, velocity_anomaly, etc.
    severity: FraudSignalSeverity;
    status: FraudSignalStatus;
    
    // Affected entities
    recruiter_id?: string;
    job_id?: string;
    candidate_id?: string;
    application_id?: string;
    placement_id?: string;
    
    // Signal data
    signal_data: Record<string, any>;
    confidence_score: number; // 0-100
    
    // Resolution
    reviewed_by?: string;
    reviewed_at?: Date;
    resolution_notes?: string;
    action_taken?: string;
    
    created_at: Date;
    updated_at: Date;
}

// Automation Rules
export type AutomationRuleStatus = 'active' | 'paused' | 'disabled';

export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    rule_type: string; // stage_transition, notification, payout_trigger, etc.
    status: AutomationRuleStatus;
    
    // Rule definition
    trigger_conditions: Record<string, any>;
    actions: Record<string, any>[];
    
    // Safety
    requires_human_approval: boolean;
    max_executions_per_day?: number;
    
    // Stats
    times_triggered: number;
    times_executed: number;
    last_triggered_at?: Date;
    last_executed_at?: Date;
    
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

// Automation Executions
export type AutomationExecutionStatus = 
    | 'pending' 
    | 'pending_approval' 
    | 'approved' 
    | 'executing' 
    | 'completed' 
    | 'failed' 
    | 'rejected';

export interface AutomationExecution {
    id: string;
    rule_id: string;
    
    // Trigger details
    trigger_data: Record<string, any>;
    triggered_by: string;
    
    // Execution status
    status: AutomationExecutionStatus;
    requires_human_approval: boolean;
    
    // Approval workflow
    approved_by?: string;
    approved_at?: Date;
    rejected_by?: string;
    rejected_at?: Date;
    rejection_reason?: string;
    
    // Execution results
    executed_at?: Date;
    action_result?: Record<string, any>;
    error_message?: string;
    
    created_at: Date;
    updated_at: Date;
}
