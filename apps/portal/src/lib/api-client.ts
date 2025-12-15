// API client for communicating with the backend gateway
// Use internal Docker URL for server-side calls, public URL for client-side
const getApiBaseUrl = () => {
    // Server-side (inside Docker container or during build)
    if (typeof window === 'undefined') {
        // If NEXT_PUBLIC_API_GATEWAY_URL is set, use it (for server-side rendering)
        if (process.env.NEXT_PUBLIC_API_GATEWAY_URL) {
            return `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api`;
        }
        
        // Default to Docker service name for server-side calls
        // This works both in development (docker-compose) and production (k8s)
        return 'http://api-gateway:3000/api';
    }
    
    // Client-side (browser)
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log the actual base URL being used
if (typeof window !== 'undefined') {
    console.log('API_BASE_URL (client):', API_BASE_URL);
} else {
    console.log('API_BASE_URL (server):', API_BASE_URL);
}

export class ApiClient {
    private baseUrl: string;
    private token?: string;

    constructor(baseUrl: string = API_BASE_URL, token?: string) {
        this.baseUrl = baseUrl;
        this.token = token;
    }

    async request<T>(
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

        // Handle 204 No Content responses
        if (response.status === 204) {
            return undefined as any;
        }

        return response.json();
    }

    // Generic HTTP methods for admin operations
    async get<T = any>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T = any>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T = any>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Identity
    async getCurrentUser() {
        return this.request('/me');
    }

    // Jobs/Roles
    // Unfiltered - returns all jobs (admins only)
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

    // Filtered by recruiter assignments - preferred for most UI
    async getRoles(filters?: { status?: string; search?: string }) {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters?.search) {
            params.append('search', filters.search);
        }
        const query = params.toString();
        return this.request(`/roles${query ? `?${query}` : ''}`);
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

    // Documents
    async uploadDocument(formData: FormData) {
        const url = `${this.baseUrl}/documents/upload`;
        const headers: Record<string, string> = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData, // Don't set Content-Type, let browser set it with boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async getDocument(id: string) {
        return this.request(`/documents/${id}`);
    }

    async getDocumentsByEntity(entityType: string, entityId: string) {
        return this.request(`/documents/entity/${entityType}/${entityId}`);
    }

    async deleteDocument(id: string) {
        return this.request(`/documents/${id}`, { method: 'DELETE' });
    }
}

// Export a singleton instance (for non-authenticated endpoints, if any)
export const apiClient = new ApiClient();

// Export a factory function for creating authenticated clients
export function createAuthenticatedClient(token: string): ApiClient {
    return new ApiClient(API_BASE_URL, token);
}
