import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    Recruiter,
    RoleAssignment,
    CandidateRoleAssignment,
    CandidateRoleAssignmentState,
    RecruiterReputation,
    RecruiterCandidate,
} from '@splits-network/shared-types';

export class NetworkRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {

        });
    }

    // Health check
    async healthCheck(): Promise<void> {
        // Simple query to verify database connectivity
        const { error } = await this.supabase
            .schema('network')
            .from('recruiters')
            .select('id')
            .limit(1);

        if (error) {
            throw new Error(`Database health check failed: ${error.message}`);
        }
    }

    // Recruiter methods
    async findRecruiterById(id: string): Promise<Recruiter | null> {
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findRecruiterByUserId(userId: string): Promise<Recruiter | null> {
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findAllRecruiters(): Promise<Recruiter[]> {
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createRecruiter(recruiter: Omit<Recruiter, 'id' | 'created_at' | 'updated_at'>): Promise<Recruiter> {
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .insert(recruiter)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRecruiter(id: string, updates: Partial<Recruiter>): Promise<Recruiter> {
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Role assignment methods
    async findRoleAssignmentsByRecruiterId(recruiterId: string): Promise<RoleAssignment[]> {
        const { data, error } = await this.supabase
            .schema('network').from('role_assignments')
            .select('*')
            .eq('recruiter_id', recruiterId);

        if (error) throw error;
        return data || [];
    }

    async findRoleAssignmentsByJobId(jobId: string): Promise<RoleAssignment[]> {
        const { data, error } = await this.supabase
            .schema('network').from('role_assignments')
            .select('*')
            .eq('job_id', jobId);

        if (error) throw error;
        return data || [];
    }

    async findRoleAssignment(jobId: string, recruiterId: string): Promise<RoleAssignment | null> {
        const { data, error } = await this.supabase
            .schema('network').from('role_assignments')
            .select('*')
            .eq('job_id', jobId)
            .eq('recruiter_id', recruiterId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createRoleAssignment(
        assignment: Omit<RoleAssignment, 'id' | 'assigned_at'>
    ): Promise<RoleAssignment> {
        const { data, error } = await this.supabase
            .schema('network').from('role_assignments')
            .insert(assignment)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteRoleAssignment(jobId: string, recruiterId: string): Promise<void> {
        const { error } = await this.supabase
            .schema('network').from('role_assignments')
            .delete()
            .eq('job_id', jobId)
            .eq('recruiter_id', recruiterId);

        if (error) throw error;
    }

    // ========================================================================
    // Phase 2: Candidate-Role Assignments (Proposal State Machine)
    // ========================================================================

    async findCandidateRoleAssignment(jobId: string, candidateId: string): Promise<CandidateRoleAssignment | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .select('*')
            .eq('job_id', jobId)
            .eq('candidate_id', candidateId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async getCandidateRoleAssignmentById(id: string): Promise<CandidateRoleAssignment | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findCandidateRoleAssignmentsByRecruiter(
        recruiterId: string,
        state?: CandidateRoleAssignmentState
    ): Promise<CandidateRoleAssignment[]> {
        let query = this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .select('*')
            .eq('recruiter_id', recruiterId);

        if (state) {
            query = query.eq('state', state);
        }

        query = query.order('proposed_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async findCandidateRoleAssignmentsByJob(
        jobId: string,
        state?: CandidateRoleAssignmentState
    ): Promise<CandidateRoleAssignment[]> {
        let query = this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .select('*')
            .eq('job_id', jobId);

        if (state) {
            query = query.eq('state', state);
        }

        query = query.order('proposed_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async findTimedOutProposals(): Promise<CandidateRoleAssignment[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .select('*')
            .eq('state', 'proposed')
            .lt('response_due_at', new Date().toISOString());

        if (error) throw error;
        return data || [];
    }

    async createCandidateRoleAssignment(assignment: any): Promise<CandidateRoleAssignment> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .insert(assignment)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCandidateRoleAssignment(
        id: string,
        updates: Partial<CandidateRoleAssignment>
    ): Promise<CandidateRoleAssignment> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('candidate_role_assignments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ========================================================================
    // Phase 2: Recruiter Reputation
    // ========================================================================

    async findRecruiterReputation(recruiterId: string): Promise<RecruiterReputation | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_reputation')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createRecruiterReputation(recruiterId: string): Promise<RecruiterReputation> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_reputation')
            .insert({ recruiter_id: recruiterId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRecruiterReputation(
        recruiterId: string,
        updates: Partial<RecruiterReputation>
    ): Promise<RecruiterReputation> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_reputation')
            .update(updates)
            .eq('recruiter_id', recruiterId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findTopRecruitersByReputation(limit: number = 10): Promise<RecruiterReputation[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_reputation')
            .select('*')
            .order('reputation_score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    // Stats methods
    async getRecruiterStats(): Promise<{ totalRecruiters: number; activeRecruiters: number; pendingRecruiters: number }> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiters')
            .select('status');

        if (error) throw error;

        const total = data?.length || 0;
        const active = data?.filter(r => r.status === 'active').length || 0;
        const pending = data?.filter(r => r.status === 'pending').length || 0;

        return {
            totalRecruiters: total,
            activeRecruiters: active,
            pendingRecruiters: pending,
        };
    }

    // Recruiter-Candidate Relationship methods
    async findRecruiterCandidateRelationship(
        recruiterId: string,
        candidateId: string
    ): Promise<RecruiterCandidate | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .eq('candidate_id', candidateId)
            .eq('status', 'active')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async getRecruiterCandidateRelationshipById(id: string): Promise<RecruiterCandidate | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createRecruiterCandidateRelationship(
        recruiterId: string,
        candidateId: string
    ): Promise<RecruiterCandidate> {
        const relationshipEndDate = new Date();
        relationshipEndDate.setMonth(relationshipEndDate.getMonth() + 12);

        // Generate invitation token and expiry (7 days)
        const invitationToken = this.generateInvitationToken();
        const invitationExpiresAt = new Date();
        invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7);

        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .insert({
                recruiter_id: recruiterId,
                candidate_id: candidateId,
                relationship_start_date: new Date(),
                relationship_end_date: relationshipEndDate,
                status: 'active',
                invited_at: new Date(),
                invitation_token: invitationToken,
                invitation_expires_at: invitationExpiresAt,
                consent_given: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    private generateInvitationToken(): string {
        // Generate cryptographically secure random token
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    async findCandidatesByRecruiterId(recruiterId: string): Promise<RecruiterCandidate[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    }

    async findRecruitersByCandidateId(candidateId: string): Promise<RecruiterCandidate[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('candidate_id', candidateId)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    }

    async updateRecruiterCandidateRelationship(
        id: string,
        updates: Partial<RecruiterCandidate>
    ): Promise<RecruiterCandidate> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async resendInvitation(id: string): Promise<RecruiterCandidate> {
        // Generate new invitation token and expiry (7 days from now)
        const invitationToken = this.generateInvitationToken();
        const invitationExpiresAt = new Date();
        invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 7);

        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .update({
                invitation_token: invitationToken,
                invitation_expires_at: invitationExpiresAt,
                invited_at: new Date(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async renewRecruiterCandidateRelationship(id: string): Promise<RecruiterCandidate> {
        const newEndDate = new Date();
        newEndDate.setMonth(newEndDate.getMonth() + 12);

        return this.updateRecruiterCandidateRelationship(id, {
            relationship_end_date: newEndDate,
            status: 'active',
        });
    }

    async findRecruiterCandidateByToken(token: string): Promise<RecruiterCandidate | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('invitation_token', token)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }
}
