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

    async findRecruiterByClerkUserId(clerkUserId: string): Promise<Recruiter | null> {
        // clerkUserId should be a Clerk user ID (e.g., "user_xxx")
        // Look it up to get the internal UUID
        let internalUserId = clerkUserId;
        
        if (clerkUserId.startsWith('user_')) {
            // This is a Clerk user ID, need to look up the internal UUID
            const { data: user, error: userError } = await this.supabase
                .schema('identity')
                .from('users')
                .select('id')
                .eq('clerk_user_id', clerkUserId)
                .single();
            
            if (userError) {
                if (userError.code === 'PGRST116') return null; // User not found
                throw userError;
            }
            
            internalUserId = user.id;
        }
        
        const { data, error } = await this.supabase
            .schema('network').from('recruiters')
            .select('*')
            .eq('user_id', internalUserId)
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

    async getRecruiterReputation(recruiterId: string): Promise<RecruiterReputation | null> {
        return this.findRecruiterReputation(recruiterId);
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
        // Check if candidate already has an active relationship with ANY recruiter
        // Business rule: only ONE active recruiter per candidate at a time
        const { data: existingActive, error: checkError } = await this.supabase
            .schema('network')
            .from('recruiter_candidates')
            .select('*')
            .eq('candidate_id', candidateId)
            .eq('status', 'active')
            .single();

        if (existingActive) {
            throw new Error(
                `Candidate already has an active relationship with recruiter ${existingActive.recruiter_id}. ` +
                `A candidate can only have one active recruiter at a time. ` +
                `Existing relationship expires on ${existingActive.relationship_end_date}.`
            );
        }

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

    // ========================================================================
    // Marketplace Methods
    // ========================================================================

    // Marketplace config
    async getMarketplaceConfig(key: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_config')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data?.value;
    }

    // Marketplace recruiters search
    async searchMarketplaceRecruiters(filters: {
        industries?: string[];
        specialties?: string[];
        location?: string;
        search?: string;
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{ data: any[]; total: number }> {
        const page = filters.page || 1;
        const limit = filters.limit || 25;
        const offset = (page - 1) * limit;

        let query = this.supabase
            .schema('network')
            .from('recruiters')
            .select('*', { count: 'exact' })
            .eq('marketplace_enabled', true)
            .eq('marketplace_visibility', 'public')
            .eq('status', 'active');

        // Apply filters
        if (filters.industries && filters.industries.length > 0) {
            query = query.overlaps('industries', filters.industries);
        }

        if (filters.specialties && filters.specialties.length > 0) {
            query = query.overlaps('specialties', filters.specialties);
        }

        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        if (filters.search) {
            query = query.or(`tagline.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
        }

        // Sorting
        const sortBy = filters.sort_by || 'created_at';
        const sortOrder = filters.sort_order || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // Enrich with user data (name, email) from identity.users
        if (data && data.length > 0) {
            const userIds = data.map(r => r.user_id);
            console.log('[MARKETPLACE] Enriching data for user IDs:', userIds);
            
            const { data: users, error: userError } = await this.supabase
                .schema('identity')
                .from('users')
                .select('id, name, email')
                .in('id', userIds);

            console.log('[MARKETPLACE] Users fetched:', users);
            console.log('[MARKETPLACE] User fetch error:', userError);

            if (!userError && users) {
                const userMap = new Map(users.map(u => [u.id, u]));
                const enrichedData = data.map(recruiter => {
                    const user = userMap.get(recruiter.user_id);
                    return {
                        ...recruiter,
                        user_name: user?.name,
                        user_email: user?.email,
                    };
                });

                console.log('[MARKETPLACE] Enriched data:', JSON.stringify(enrichedData, null, 2));

                return {
                    data: enrichedData,
                    total: count || 0,
                };
            }
        }

        return {
            data: data || [],
            total: count || 0,
        };
    }

    // Get single marketplace recruiter
    async getMarketplaceRecruiter(recruiterId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('recruiters')
            .select('*')
            .eq('id', recruiterId)
            .eq('marketplace_enabled', true)
            .eq('marketplace_visibility', 'public')
            .eq('status', 'active')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // Enrich with user data
        if (data) {
            const { data: user, error: userError } = await this.supabase
                .schema('identity')
                .from('users')
                .select('id, name, email')
                .eq('id', data.user_id)
                .single();

            if (!userError && user) {
                return {
                    ...data,
                    user_name: user.name,
                    user_email: user.email,
                };
            }
        }

        return data;
    }

    // Marketplace connections
    async createMarketplaceConnection(data: {
        candidate_user_id: string;
        recruiter_id: string;
        message?: string;
    }): Promise<any> {
        const { data: connection, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return connection;
    }

    async findMarketplaceConnection(
        candidateUserId: string,
        recruiterId: string
    ): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .select('*')
            .eq('candidate_user_id', candidateUserId)
            .eq('recruiter_id', recruiterId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async getMarketplaceConnectionById(connectionId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .select('*')
            .eq('id', connectionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async listCandidateConnections(candidateUserId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .select('*')
            .eq('candidate_user_id', candidateUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async listRecruiterConnections(recruiterId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async updateMarketplaceConnection(
        connectionId: string,
        updates: { status?: string; responded_at?: Date }
    ): Promise<any> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_connections')
            .update(updates)
            .eq('id', connectionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Marketplace messages
    async createMarketplaceMessage(data: {
        connection_id: string;
        sender_user_id: string;
        sender_type: 'candidate' | 'recruiter';
        message: string;
    }): Promise<any> {
        const { data: message, error } = await this.supabase
            .schema('network')
            .from('marketplace_messages')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return message;
    }

    async listConnectionMessages(connectionId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('network')
            .from('marketplace_messages')
            .select('*')
            .eq('connection_id', connectionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async markMessageAsRead(messageId: string): Promise<void> {
        const { error } = await this.supabase
            .schema('network')
            .from('marketplace_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', messageId);

        if (error) throw error;
    }

    async markConnectionMessagesAsRead(connectionId: string, userIdNotSender: string): Promise<void> {
        const { error } = await this.supabase
            .schema('network')
            .from('marketplace_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('connection_id', connectionId)
            .neq('sender_user_id', userIdNotSender)
            .is('read_at', null);

        if (error) throw error;
    }

    async getUnreadMessageCount(connectionId: string, userIdNotSender: string): Promise<number> {
        const { count, error } = await this.supabase
            .schema('network')
            .from('marketplace_messages')
            .select('*', { count: 'exact', head: true })
            .eq('connection_id', connectionId)
            .neq('sender_user_id', userIdNotSender)
            .is('read_at', null);

        if (error) throw error;
        return count || 0;
    }
}

