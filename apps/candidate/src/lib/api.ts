/**
 * API Client for Applicant Network
 * Communicates with backend services via API Gateway
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
    authToken?: string | null
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };
    
    // Add auth token if provided
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorCode: string | undefined;
        
        try {
            const errorData = await response.json();
            // Handle different error response formats
            if (errorData.error && typeof errorData.error === 'object') {
                // Error is an object with code/message (API Gateway format)
                errorMessage = errorData.error.message || errorData.error.code || errorMessage;
                errorCode = errorData.error.code;
            } else {
                // Error is a simple string or message field
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorCode = typeof errorData.error === 'string' ? errorData.error : undefined;
            }
        } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
        }
        
        throw new ApiError(errorMessage, response.status, errorCode);
    }

    const json = await response.json();
    
    // API Gateway wraps responses in { data: ... }
    // Unwrap if the response has a data property
    if (json && typeof json === 'object' && 'data' in json) {
        return json.data as T;
    }
    
    return json as T;
}

// Invitation API
export interface InvitationDetails {
    relationship_id: string;
    recruiter_id: string;
    candidate_id: string;
    invited_at: string;
    expires_at: string;
    status: 'pending';
}

export interface RecruiterDetails {
    id: string;
    user_id: string;
    bio?: string;
    status: string;
}

export interface CandidateDetails {
    id: string;
    full_name: string;
    email: string;
}

export interface UserDetails {
    id: string;
    name: string;
    email: string;
}

export async function getInvitationDetails(token: string, authToken?: string | null): Promise<InvitationDetails> {
    return fetchApi<InvitationDetails>(`/api/network/recruiter-candidates/invitation/${token}`, {}, authToken);
}

export async function acceptInvitation(token: string, authToken?: string | null): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
        `/api/network/recruiter-candidates/invitation/${token}/accept`,
        {
            method: 'POST',
            body: JSON.stringify({}),
        },
        authToken
    );
}

export async function declineInvitation(
    token: string,
    reason?: string,
    authToken?: string | null
): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
        `/api/network/recruiter-candidates/invitation/${token}/decline`,
        {
            method: 'POST',
            body: JSON.stringify({ reason }),
        },
        authToken
    );
}

export async function getRecruiterDetails(recruiterId: string, authToken?: string | null): Promise<RecruiterDetails> {
    return fetchApi<RecruiterDetails>(`/api/network/recruiters/${recruiterId}`, {}, authToken);
}

export async function getCandidateDetails(candidateId: string, authToken?: string | null): Promise<CandidateDetails> {
    return fetchApi<CandidateDetails>(`/api/ats/candidates/${candidateId}`, {}, authToken);
}

export async function getUserDetails(userId: string, authToken?: string | null): Promise<UserDetails> {
    return fetchApi<UserDetails>(`/api/identity/users/${userId}`, {}, authToken);
}

// Dashboard API
export interface DashboardStats {
    applications: number;
    interviews: number;
    offers: number;
    active_relationships: number;
}

export interface RecentApplication {
    id: string;
    job_id: string;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
}

export interface Application {
    id: string;
    job_id: string;
    job_title: string;
    company: string;
    location: string;
    status: string;
    stage: string;
    applied_at: string;
    updated_at: string;
    notes?: string;
}

export async function getDashboardStats(authToken: string): Promise<DashboardStats> {
    return fetchApi<DashboardStats>('/api/candidate/dashboard/stats', {}, authToken);
}

export async function getRecentApplications(authToken: string): Promise<RecentApplication[]> {
    return fetchApi<RecentApplication[]>('/api/candidate/dashboard/recent-applications', {}, authToken);
}

export async function getApplications(authToken: string): Promise<Application[]> {
    return fetchApi<Application[]>('/api/candidate/applications', {}, authToken);
}

// Documents API
export interface Document {
    id: string;
    entity_type: string;
    entity_id: string;
    document_type: string;
    filename: string;
    storage_path: string;
    bucket_name: string;
    content_type: string;
    file_size: number;
    uploaded_by_user_id?: string;
    processing_status: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export async function getMyDocuments(authToken: string): Promise<Document[]> {
    return fetchApi<Document[]>('/api/candidates/me/documents', {}, authToken);
}

export async function uploadDocument(formData: FormData, authToken: string): Promise<Document> {
    console.log('uploadDocument called with API_BASE_URL:', API_BASE_URL);
    const url = `${API_BASE_URL}/api/documents/upload`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
        let errorMessage = 'Failed to upload document';
        try {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            errorMessage = response.statusText || errorMessage;
        }
        throw new ApiError(errorMessage, response.status);
    }

    const json = await response.json();
    console.log('Upload response data:', json);
    return json.data || json;
}

export async function deleteDocument(documentId: string, authToken: string): Promise<void> {
    await fetchApi<void>(`/api/documents/${documentId}`, {
        method: 'DELETE',
    }, authToken);
}

export async function getDocumentUrl(documentId: string, authToken: string): Promise<string> {
    const doc = await fetchApi<{ downloadUrl: string }>(`/api/documents/${documentId}`, {}, authToken);
    return doc.downloadUrl;
}

// Candidate Profile API
export interface CandidateProfile {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    current_title?: string;
    current_company?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    bio?: string;
    skills?: string;
    created_at: string;
    updated_at: string;
}

export async function getMyCandidateProfile(authToken: string): Promise<CandidateProfile | null> {
    try {
        return await fetchApi<CandidateProfile>('/api/candidates/me', {}, authToken);
    } catch (error: any) {
        // Return null if candidate profile doesn't exist yet
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

export async function getCurrentUser(authToken: string): Promise<{ id: string; email: string; name?: string }> {
    return fetchApi<{ id: string; email: string; name?: string }>('/api/me', {}, authToken);
}

// Recruiter Relationships API
export interface RecruiterRelationship {
    id: string;
    recruiter_id: string;
    recruiter_name: string;
    recruiter_email: string;
    recruiter_bio?: string;
    recruiter_status: string;
    relationship_start_date: string;
    relationship_end_date: string;
    status: 'active' | 'expired' | 'terminated';
    consent_given: boolean;
    consent_given_at?: string;
    created_at: string;
    days_until_expiry?: number;
}

export interface MyRecruitersResponse {
    active: RecruiterRelationship[];
    expired: RecruiterRelationship[];
    terminated: RecruiterRelationship[];
}

export async function getMyRecruiters(authToken: string): Promise<MyRecruitersResponse> {
    return fetchApi<MyRecruitersResponse>('/api/candidates/me/recruiters', {}, authToken);
}

export async function getMyProfile(authToken: string): Promise<CandidateProfile | null> {
    return getMyCandidateProfile(authToken);
}

export async function updateMyProfile(authToken: string, updates: Partial<CandidateProfile>): Promise<CandidateProfile> {
    return fetchApi<CandidateProfile>('/api/candidates/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    }, authToken);
}
