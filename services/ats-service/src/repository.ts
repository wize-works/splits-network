import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    Company,
    Job,
    Candidate,
    Application,
    Placement,
    CandidateSourcer,
    CandidateOutreach,
    PlacementCollaborator,
    ApplicationAuditLog,
} from '@splits-network/shared-types';

export class AtsRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Health check
    async healthCheck(): Promise<void> {
        // Simple query to verify database connectivity
        const { error } = await this.supabase
            .schema('ats')
            .from('jobs')
            .select('id')
            .limit(1);

        if (error) {
            throw new Error(`Database health check failed: ${error.message}`);
        }
    }

    // Company methods
    async findAllCompanies(): Promise<Company[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('companies')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }

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

    async findCompanyByOrgId(orgId: string): Promise<Company | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('companies')
            .select('*')
            .eq('identity_organization_id', orgId)
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

    async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Job methods
    async findJobs(filters?: { 
        status?: string; 
        search?: string; 
        location?: string;
        employment_type?: string;
        limit?: number; 
        offset?: number;
    }): Promise<Job[]> {
        // Use database function for efficient search including company name
        const searchTerms = filters?.search 
            ? filters.search.trim().split(/\s+/).filter(term => term.length > 0)
            : null;

        const { data, error } = await this.supabase
            .schema('ats')
            .rpc('search_jobs_with_company', {
                search_terms: searchTerms,
                filter_status: filters?.status || null,
                filter_location: filters?.location || null,
                filter_employment_type: filters?.employment_type || null,
                result_limit: filters?.limit || 50,
                result_offset: filters?.offset || 0,
            });

        if (error) throw error;
        
        // Transform database results to Job format with company data
        return (data || []).map((row: any) => ({
            id: row.id,
            company_id: row.company_id,
            title: row.title,
            department: row.department,
            location: row.location,
            salary_min: row.salary_min,
            salary_max: row.salary_max,
            fee_percentage: row.fee_percentage,
            recruiter_description: row.recruiter_description,
            candidate_description: row.candidate_description,
            employment_type: row.employment_type,
            open_to_relocation: row.open_to_relocation,
            show_salary_range: row.show_salary_range,
            splits_fee_percentage: row.splits_fee_percentage,
            job_owner_id: row.job_owner_id,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            company: {
                id: row.company_id,
                name: row.company_name,
                identity_organization_id: row.company_identity_organization_id,
                created_at: row.company_created_at,
                updated_at: row.company_updated_at,
            },
        }));
    }

    async countJobs(filters?: { 
        status?: string; 
        search?: string; 
        location?: string;
        employment_type?: string;
    }): Promise<number> {
        // Use database function for efficient counting
        const searchTerms = filters?.search 
            ? filters.search.trim().split(/\s+/).filter(term => term.length > 0)
            : null;

        const { data, error } = await this.supabase
            .schema('ats')
            .rpc('count_jobs_with_company', {
                search_terms: searchTerms,
                filter_status: filters?.status || null,
                filter_location: filters?.location || null,
                filter_employment_type: filters?.employment_type || null,
            });

        if (error) throw error;
        return data || 0;
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

    // Job Requirements methods
    async findJobRequirements(jobId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_requirements')
            .select('*')
            .eq('job_id', jobId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createJobRequirement(requirement: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_requirements')
            .insert(requirement)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteJobRequirements(jobId: string): Promise<void> {
        const { error } = await this.supabase
            .schema('ats')
            .from('job_requirements')
            .delete()
            .eq('job_id', jobId);

        if (error) throw error;
    }

    // Job Pre-Screen Questions methods
    async findJobPreScreenQuestions(jobId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_questions')
            .select('*')
            .eq('job_id', jobId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createJobPreScreenQuestion(question: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_questions')
            .insert(question)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteJobPreScreenQuestions(jobId: string): Promise<void> {
        const { error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_questions')
            .delete()
            .eq('job_id', jobId);

        if (error) throw error;
    }

    // Candidate methods
    async findAllCandidates(filters?: { search?: string; limit?: number; offset?: number; recruiter_id?: string }): Promise<Candidate[]> {
        let query = this.supabase
            .schema('ats')
            .from('candidates')
            .select('*');

        if (filters?.recruiter_id) {
            // Filter to candidates SOURCED by this recruiter (permanent visibility only, NOT editing rights)
            // Note: This shows candidates the recruiter brought to the platform
            // Active relationships (in network.recruiter_candidates) are required for editing/representing
            query = query.eq('recruiter_id', filters.recruiter_id);
        }

        if (filters?.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        query = query.order('created_at', { ascending: false });

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

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
        const { data, error} = await this.supabase
            .schema('ats')
            .from('candidates')
            .insert(candidate)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCandidate(id: string, updates: { 
        full_name?: string; 
        email?: string; 
        linkedin_url?: string;
        github_url?: string;
        portfolio_url?: string;
        phone?: string;
        location?: string;
        current_title?: string;
        current_company?: string;
        bio?: string;
        skills?: string;
    }): Promise<Candidate> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Link candidate to user account and verify them
     * Called when candidate accepts invitation and creates account
     */
    async linkCandidateToUser(candidateId: string, userId: string): Promise<Candidate> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidates')
            .update({
                user_id: userId,
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
                verified_by_user_id: userId,
            })
            .eq('id', candidateId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Application methods
    async findApplications(filters?: {
        recruiter_id?: string;
        job_id?: string;
        job_ids?: string[];
        candidate_id?: string;
        stage?: string
    }): Promise<Application[]> {
        let query = this.supabase
            .schema('ats')
            .from('applications')
            .select('*');

        if (filters?.recruiter_id) {
            query = query.eq('recruiter_id', filters.recruiter_id);
        }
        if (filters?.job_id) {
            query = query.eq('job_id', filters.job_id);
        }
        if (filters?.job_ids && filters.job_ids.length > 0) {
            query = query.in('job_id', filters.job_ids);
        }
        if (filters?.candidate_id) {
            query = query.eq('candidate_id', filters.candidate_id);
        }
        if (filters?.stage) {
            query = query.eq('stage', filters.stage);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    // Server-side paginated applications with enriched data using database function (fast!)
    async findApplicationsPaginated(params: {
        page?: number;
        limit?: number;
        search?: string;
        stage?: string;
        recruiter_id?: string;
        job_id?: string;
        job_ids?: string[];
        candidate_id?: string;
        company_id?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        data: Array<Application & {
            candidate: { id: string; full_name: string; email: string; linkedin_url?: string; _masked?: boolean };
            job: { id: string; title: string; company_id: string };
            company: { id: string; name: string };
            recruiter?: { id: string; name: string; email: string };
        }>;
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }> {
        const page = params.page || 1;
        const limit = params.limit || 25;
        const offset = (page - 1) * limit;
        const sortBy = params.sort_by || 'created_at';
        const sortOrder = params.sort_order || 'desc';

        // Use database function for maximum performance with full-text search
        const { data, error } = await this.supabase
            .schema('ats')
            .rpc('search_applications_paginated', {
                search_terms: params.search || null,
                filter_recruiter_id: params.recruiter_id || null,
                filter_job_id: params.job_id || null,
                filter_candidate_id: params.candidate_id || null,
                filter_stage: params.stage || null,
                filter_company_id: params.company_id || null,
                sort_column: sortBy,
                sort_direction: sortOrder,
                result_limit: limit,
                result_offset: offset,
            });

        if (error) throw error;

        // Get total from first row (window function COUNT(*) OVER())
        const total = data && data.length > 0 ? data[0].total_count : 0;

        // Map database results to expected nested structure
        const enrichedData = (data || []).map((row: any) => ({
            id: row.id,
            job_id: row.job_id,
            candidate_id: row.candidate_id,
            recruiter_id: row.recruiter_id,
            stage: row.stage,
            notes: row.notes,
            created_at: row.created_at,
            updated_at: row.updated_at,
            accepted_by_company: row.accepted_by_company,
            accepted_at: row.accepted_at,
            recruiter_notes: row.recruiter_notes,
            application_source: row.application_source,
            candidate: {
                id: row.candidate_id,
                full_name: row.candidate_name,
                email: row.candidate_email,
                linkedin_url: row.candidate_linkedin,
            },
            job: {
                id: row.job_id,
                title: row.job_title,
                company_id: row.company_id,
            },
            company: row.company_id ? {
                id: row.company_id,
                name: row.company_name,
            } : null,
        }));

        const totalPages = Math.ceil(total / limit);

        return {
            data: enrichedData,
            total,
            page,
            limit,
            total_pages: totalPages,
        };
    }

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

    async findApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('applications')
            .select('*')
            .eq('candidate_id', candidateId)
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
    async findAllPlacements(filters?: {
        recruiter_id?: string;
        company_id?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<Placement[]> {
        let query = this.supabase
            .schema('ats')
            .from('placements')
            .select('*');

        if (filters?.recruiter_id) {
            query = query.eq('recruiter_id', filters.recruiter_id);
        }
        if (filters?.company_id) {
            query = query.eq('company_id', filters.company_id);
        }
        if (filters?.date_from) {
            query = query.gte('hired_at', filters.date_from);
        }
        if (filters?.date_to) {
            query = query.lte('hired_at', filters.date_to);
        }

        query = query.order('hired_at', { ascending: false });

        const { data, error } = await query;

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

    async updatePlacement(id: string, updates: Partial<Placement>): Promise<Placement> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ========================================================================
    // Phase 2: Candidate Sourcing & Ownership
    // ========================================================================

    async findCandidateSourcer(candidateId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidate_sourcers')
            .select('*')
            .eq('candidate_id', candidateId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createCandidateSourcer(sourcer: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidate_sourcers')
            .insert(sourcer)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findAllCandidateSourcers(): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidate_sourcers')
            .select('*')
            .order('sourced_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findCandidateOutreach(filters: {
        candidate_id?: string;
        recruiter_user_id?: string;
        job_id?: string;
    }): Promise<any[]> {
        let query = this.supabase
            .schema('ats')
            .from('candidate_outreach')
            .select('*');

        if (filters.candidate_id) {
            query = query.eq('candidate_id', filters.candidate_id);
        }
        if (filters.recruiter_user_id) {
            query = query.eq('recruiter_user_id', filters.recruiter_user_id);
        }
        if (filters.job_id) {
            query = query.eq('job_id', filters.job_id);
        }

        query = query.order('sent_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async createCandidateOutreach(outreach: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidate_outreach')
            .insert(outreach)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateCandidateOutreach(id: string, updates: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('candidate_outreach')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ========================================================================
    // Phase 2: Placement Collaborators
    // ========================================================================

    async findPlacementCollaborators(placementId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placement_collaborators')
            .select('*')
            .eq('placement_id', placementId);

        if (error) throw error;
        return data || [];
    }

    async createPlacementCollaborator(collaborator: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placement_collaborators')
            .insert(collaborator)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findCollaborationsByRecruiter(recruiterUserId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('placement_collaborators')
            .select('*')
            .eq('recruiter_user_id', recruiterUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // Stats methods
    async getAtsStats(): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        totalPlacements: number
    }> {
        // Use Promise.all to fetch all counts in parallel
        const [jobsData, applicationsData, placementsData] = await Promise.all([
            this.supabase.schema('ats').from('jobs').select('status'),
            this.supabase.schema('ats').from('applications').select('id', { count: 'exact', head: true }),
            this.supabase.schema('ats').from('placements').select('id', { count: 'exact', head: true }),
        ]);

        if (jobsData.error) throw jobsData.error;
        if (applicationsData.error) throw applicationsData.error;
        if (placementsData.error) throw placementsData.error;

        const totalJobs = jobsData.data?.length || 0;
        const activeJobs = jobsData.data?.filter(j => j.status === 'active').length || 0;
        const totalApplications = applicationsData.count || 0;
        const totalPlacements = placementsData.count || 0;

        return {
            totalJobs,
            activeJobs,
            totalApplications,
            totalPlacements,
        };
    }

    // Audit log methods
    async createAuditLog(log: Omit<ApplicationAuditLog, 'id' | 'created_at'>): Promise<ApplicationAuditLog> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('application_audit_log')
            .insert({
                application_id: log.application_id,
                action: log.action,
                performed_by_user_id: log.performed_by_user_id,
                performed_by_role: log.performed_by_role,
                company_id: log.company_id,
                old_value: log.old_value,
                new_value: log.new_value,
                metadata: log.metadata,
                ip_address: log.ip_address,
                user_agent: log.user_agent,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAuditLogsForApplication(applicationId: string): Promise<ApplicationAuditLog[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('application_audit_log')
            .select('*')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getAuditLogsForCompany(companyId: string, limit?: number): Promise<ApplicationAuditLog[]> {
        let query = this.supabase
            .schema('ats')
            .from('application_audit_log')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    // Document linking methods (uses existing documents table with entity pattern)
    async linkDocumentToApplication(
        documentId: string,
        applicationId: string,
        isPrimary: boolean
    ): Promise<void> {
        // Get the original document to copy storage details
        const { data: originalDoc, error: fetchError } = await this.supabase
            .schema('documents')
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (fetchError || !originalDoc) {
            throw new Error(`Document ${documentId} not found`);
        }

        // Create new document record linked to application (same storage_path, new entity)
        const { error: insertError } = await this.supabase
            .schema('documents')
            .from('documents')
            .insert({
                entity_type: 'application',
                entity_id: applicationId,
                document_type: originalDoc.document_type,
                filename: originalDoc.filename,
                storage_path: originalDoc.storage_path,
                bucket_name: originalDoc.bucket_name,
                content_type: originalDoc.content_type,
                file_size: originalDoc.file_size,
                uploaded_by_user_id: originalDoc.uploaded_by_user_id,
                processing_status: originalDoc.processing_status,
                metadata: { 
                    ...originalDoc.metadata, 
                    is_primary: isPrimary,
                    original_document_id: documentId 
                },
            });

        if (insertError) throw insertError;
    }

    async getDocumentsForApplication(applicationId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('documents')
            .from('documents')
            .select('*')
            .eq('entity_type', 'application')
            .eq('entity_id', applicationId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // Pre-screen answer methods
    async createPreScreenAnswer(answer: {
        application_id: string;
        question_id: string;
        answer: any;
    }): Promise<any> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_answers')
            .insert(answer)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getPreScreenAnswersForApplication(applicationId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_answers')
            .select(`
                *,
                question:job_pre_screen_questions(*)
            `)
            .eq('application_id', applicationId);

        if (error) throw error;
        return data || [];
    }

    async getPreScreenQuestionsForJob(jobId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('ats')
            .from('job_pre_screen_questions')
            .select('*')
            .eq('job_id', jobId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}

