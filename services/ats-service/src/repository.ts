import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    Company,
    Job,
    Candidate,
    Application,
    Placement,
} from '@splits-network/shared-types';

export class AtsRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Company methods
    async findCompanyById(id: string): Promise<Company | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('companies')
            .insert(company)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Job methods
    async findJobs(filters?: { status?: string; search?: string }): Promise<Job[]> {
        let query = this.supabase.schema('ats').from('jobs').select('*');

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,department.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async findJobById(id: string): Promise<Job | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findJobsByCompanyId(companyId: string): Promise<Job[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findJobsByIds(ids: string[]): Promise<Job[]> {
        if (ids.length === 0) return [];

        const { data, error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .select('*')
            .in('id', ids);

        if (error) throw error;
        return data || [];
    }

    async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Promise<Job> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .insert(job)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Candidate methods
    async findCandidateById(id: string): Promise<Candidate | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findCandidateByEmail(email: string): Promise<Candidate | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidates')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidates')
            .insert(candidate)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Application methods
    async findApplicationById(id: string): Promise<Application | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findApplicationsByJobId(jobId: string): Promise<Application[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findApplicationsByRecruiterId(recruiterId: string): Promise<Application[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at'>): Promise<Application> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .insert(application)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Placement methods
    async findAllPlacements(): Promise<Placement[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .select('*')
            .order('hired_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findPlacementById(id: string): Promise<Placement | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findPlacementsByRecruiterId(recruiterId: string): Promise<Placement[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('hired_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findPlacementsByCompanyId(companyId: string): Promise<Placement[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .select('*')
            .eq('company_id', companyId)
            .order('hired_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createPlacement(placement: Omit<Placement, 'id' | 'created_at' | 'updated_at'>): Promise<Placement> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .insert(placement)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}


