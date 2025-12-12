import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Recruiter, RoleAssignment } from '@splits-network/shared-types';

export class NetworkRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
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
}




