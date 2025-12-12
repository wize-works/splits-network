// API client for communicating with the backend gateway
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Debug: Log the actual base URL being used
if (typeof window !== 'undefined') {
    console.log('API_BASE_URL:', API_BASE_URL);
}

export class ApiClient {
    private baseUrl: string;
    private token?: string;

    constructor(baseUrl: string = API_BASE_URL, token?: string) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers as Record<string, string>,
        };

        // Add authorization header if token is available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Identity
    async getCurrentUser() {
        return this.request('/me');
    }

    // Jobs/Roles
    async getJobs(filters?: { status?: string; search?: string }) {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }
        const query = params.toString();
        return this.request(`/jobs${query ? `?${query}` : ''}`);
    }

    async getJob(id: string) {
        return this.request(`/jobs/${id}`);
    }

    async createJob(data: any) {
        return this.request('/jobs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateJob(id: string, data: any) {
        return this.request(`/jobs/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Applications
    async getApplicationsByJob(jobId: string) {
        return this.request(`/jobs/${jobId}/applications`);
    }

    async submitCandidate(data: {
        job_id: string;
        full_name: string;
        email: string;
        linkedin_url?: string;
        notes?: string;
    }) {
        return this.request('/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateApplicationStage(id: string, stage: string, notes?: string) {
        return this.request(`/applications/${id}/stage`, {
            method: 'PATCH',
            body: JSON.stringify({ stage, notes }),
        });
    }

    // Placements
    async getPlacements(filters?: { recruiter_id?: string; company_id?: string }) {
        const params = new URLSearchParams();
        if (filters?.recruiter_id) {
            params.append('recruiter_id', filters.recruiter_id);
        }
        if (filters?.company_id) {
            params.append('company_id', filters.company_id);
        }
        const query = params.toString();
        return this.request(`/placements${query ? `?${query}` : ''}`);
    }

    async createPlacement(data: {
        application_id: string;
        salary: number;
        hired_at?: string;
    }) {
        return this.request('/placements', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Recruiters
    async getRecruiterProfile() {
        return this.request('/recruiters/me');
    }

    async getRecruiterJobs(recruiterId: string) {
        return this.request(`/recruiters/${recruiterId}/jobs`);
    }

    // Subscriptions
    async getMySubscription() {
        return this.request('/subscriptions/me');
    }
}

// Export a singleton instance (for non-authenticated endpoints, if any)
export const apiClient = new ApiClient();

// Export a factory function for creating authenticated clients
export function createAuthenticatedClient(token: string): ApiClient {
    return new ApiClient(API_BASE_URL, token);
}
