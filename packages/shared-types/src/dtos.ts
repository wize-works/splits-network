// DTOs for API requests and responses

// Identity DTOs
export interface UserProfileDTO {
    id: string;
    email: string;
    name: string;
    memberships: MembershipDTO[];
}

export interface MembershipDTO {
    id: string;
    organization_id: string;
    organization_name: string;
    role: string;
}

// ATS DTOs
export interface CreateJobDTO {
    title: string;
    department?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    fee_percentage: number;
    description?: string;
    status?: string;
}

export interface JobDTO {
    id: string;
    company_id: string;
    company_name: string;
    title: string;
    department?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    fee_percentage: number;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface SubmitCandidateDTO {
    job_id: string;
    full_name: string;
    email: string;
    linkedin_url?: string;
    notes?: string;
}

export interface CandidateDTO {
    id: string;
    full_name: string;
    email: string;
    linkedin_url?: string;
    created_at: string;
}

export interface ApplicationDTO {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    recruiter_id?: string;
    recruiter_name?: string;
    stage: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateApplicationStageDTO {
    stage: string;
    notes?: string;
}

export interface CreatePlacementDTO {
    application_id: string;
    salary: number;
    fee_percentage: number;
}

export interface PlacementDTO {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    company_id: string;
    company_name: string;
    recruiter_id: string;
    recruiter_name: string;
    hired_at: string;
    salary: number;
    fee_percentage: number;
    fee_amount: number;
    recruiter_share: number;
    platform_share: number;
    created_at: string;
}

// Network DTOs
export interface RecruiterDTO {
    id: string;
    user_id: string;
    name: string;
    email: string;
    status: string;
    bio?: string;
    created_at: string;
}

export interface AssignRecruiterDTO {
    job_id: string;
    recruiter_id: string;
}

// Billing DTOs
export interface SubscriptionDTO {
    id: string;
    recruiter_id: string;
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at?: string;
}

// Common response wrappers
export interface ApiResponse<T> {
    data: T;
    meta?: Record<string, any>;
}

export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}
