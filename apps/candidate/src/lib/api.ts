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
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorCode = errorData.error;
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
