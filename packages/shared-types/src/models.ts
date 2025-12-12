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
