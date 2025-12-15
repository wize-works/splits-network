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
