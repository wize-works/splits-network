import { BaseClient, BaseClientConfig, ApiResponse } from './base-client';
import {
    Recruiter,
    RoleAssignment,
    CandidateRoleAssignment,
    RecruiterReputation,
} from '@splits-network/shared-types';

/**
 * Client for Network Service (Phase 1 + Phase 2)
 */
export class NetworkClient extends BaseClient {
    constructor(config: BaseClientConfig) {
        super(config);
    }

    // ========================================================================
    // Phase 1: Recruiters
    // ========================================================================

    async listRecruiters(): Promise<ApiResponse<Recruiter[]>> {
        return this.get('/recruiters');
    }

    async getRecruiter(recruiterId: string): Promise<ApiResponse<Recruiter>> {
        return this.get(`/recruiters/${recruiterId}`);
    }

    async getRecruiterByClerkUserId(clerkUserId: string): Promise<ApiResponse<Recruiter>> {
        return this.get(`/recruiters/by-user/${clerkUserId}`);
    }

    async createRecruiter(data: {
        clerk_user_id: string;
        bio?: string;
        industries?: string[];
        specialties?: string[];
        location?: string;
        tagline?: string;
        years_experience?: number;
    }): Promise<ApiResponse<Recruiter>> {
        return this.post('/recruiters', data);
    }

    async updateRecruiter(recruiterId: string, data: Partial<Recruiter>): Promise<ApiResponse<Recruiter>> {
        return this.put(`/recruiters/${recruiterId}`, data);
    }

    // ========================================================================
    // Phase 1: Role Assignments
    // ========================================================================

    async listRoleAssignments(jobId?: string): Promise<ApiResponse<RoleAssignment[]>> {
        const query = jobId ? `?job_id=${jobId}` : '';
        return this.get(`/assignments${query}`);
    }

    async assignRecruiterToRole(data: {
        job_id: string;
        recruiter_id: string;
        assigned_by?: string;
    }): Promise<ApiResponse<RoleAssignment>> {
        return this.post('/assignments', data);
    }

    async removeRoleAssignment(assignmentId: string): Promise<ApiResponse<void>> {
        return this.delete(`/assignments/${assignmentId}`);
    }

    // ========================================================================
    // Phase 2: Candidate-Role Assignment Proposals
    // ========================================================================

    async createProposal(data: {
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
        proposed_by?: string;
        proposal_notes?: string;
        response_due_days?: number;
    }): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.post('/proposals', data);
    }

    async getProposal(assignmentId: string): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.get(`/proposals/${assignmentId}`);
    }

    async listProposals(filters?: {
        recruiter_id?: string;
        job_id?: string;
        candidate_id?: string;
        state?: string;
    }): Promise<ApiResponse<CandidateRoleAssignment[]>> {
        const queryParams = new URLSearchParams();
        if (filters?.recruiter_id) queryParams.set('recruiter_id', filters.recruiter_id);
        if (filters?.job_id) queryParams.set('job_id', filters.job_id);
        if (filters?.candidate_id) queryParams.set('candidate_id', filters.candidate_id);
        if (filters?.state) queryParams.set('state', filters.state);
        
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.get(`/proposals${query}`);
    }

    async acceptProposal(assignmentId: string, data?: {
        response_notes?: string;
    }): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.post(`/proposals/${assignmentId}/accept`, data || {});
    }

    async declineProposal(assignmentId: string, data?: {
        response_notes?: string;
    }): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.post(`/proposals/${assignmentId}/decline`, data || {});
    }

    async markProposalSubmitted(assignmentId: string): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.post(`/proposals/${assignmentId}/submit`, {});
    }

    async closeProposal(assignmentId: string): Promise<ApiResponse<CandidateRoleAssignment>> {
        return this.post(`/proposals/${assignmentId}/close`, {});
    }

    // ========================================================================
    // Phase 2: Recruiter Reputation
    // ========================================================================

    async getRecruiterReputation(recruiterId: string): Promise<ApiResponse<RecruiterReputation>> {
        return this.get(`/recruiters/${recruiterId}/reputation`);
    }

    async refreshRecruiterReputation(recruiterId: string): Promise<ApiResponse<RecruiterReputation>> {
        return this.post(`/recruiters/${recruiterId}/reputation/refresh`, {});
    }

    async getTopRecruiters(filters?: {
        limit?: number;
        metric?: 'reputation_score' | 'hire_rate' | 'completion_rate';
    }): Promise<ApiResponse<Array<{
        recruiter: Recruiter;
        reputation: RecruiterReputation;
    }>>> {
        const queryParams = new URLSearchParams();
        if (filters?.limit) queryParams.set('limit', filters.limit.toString());
        if (filters?.metric) queryParams.set('metric', filters.metric);
        
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return this.get(`/leaderboard${query}`);
    }
}
