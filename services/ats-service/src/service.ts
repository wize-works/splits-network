import { AtsRepository } from './repository';
import { EventPublisher } from './events';
import {
    Job,
    Application,
    Candidate,
    Placement,
    Company,
    ApplicationStage,
} from '@splits-network/shared-types';

export class AtsService {
    constructor(
        private repository: AtsRepository,
        private eventPublisher: EventPublisher
    ) { }

    // Company methods
    async getCompanies(): Promise<Company[]> {
        return await this.repository.findAllCompanies();
    }

    async getCompanyById(id: string): Promise<Company> {
        const company = await this.repository.findCompanyById(id);
        if (!company) {
            throw new Error(`Company ${id} not found`);
        }
        return company;
    }

    async getCompanyByOrgId(orgId: string): Promise<Company | null> {
        return await this.repository.findCompanyByOrgId(orgId);
    }

    async createCompany(name: string, identityOrgId?: string): Promise<Company> {
        return await this.repository.createCompany({
            name,
            identity_organization_id: identityOrgId,
        });
    }

    async updateCompany(id: string, updates: { name?: string; identity_organization_id?: string }): Promise<Company> {
        // Verify company exists
        await this.getCompanyById(id);
        return await this.repository.updateCompany(id, updates);
    }

    // Job methods
    async getJobs(filters?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<Job[]> {
        const jobs = await this.repository.findJobs(filters);

        // Enrich with company data
        const enrichedJobs = await Promise.all(
            jobs.map(async (job) => {
                const company = await this.repository.findCompanyById(job.company_id);
                return { ...job, company: company ?? undefined };
            })
        );

        return enrichedJobs;
    }

    async getJobById(id: string): Promise<Job> {
        const job = await this.repository.findJobById(id);
        if (!job) {
            throw new Error(`Job ${id} not found`);
        }

        // Enrich with company data
        const company = await this.repository.findCompanyById(job.company_id);
        return { ...job, company: company ?? undefined };
    }

    async getJobsByCompanyId(companyId: string): Promise<Job[]> {
        return await this.repository.findJobsByCompanyId(companyId);
    }

    async getJobsByIds(ids: string[]): Promise<Job[]> {
        return await this.repository.findJobsByIds(ids);
    }

    async createJob(
        companyId: string,
        title: string,
        feePercentage: number,
        options: {
            department?: string;
            location?: string;
            salary_min?: number;
            salary_max?: number;
            description?: string;
            status?: 'active' | 'paused' | 'filled' | 'closed';
        } = {}
    ): Promise<Job> {
        return await this.repository.createJob({
            company_id: companyId,
            title,
            fee_percentage: feePercentage,
            department: options.department,
            location: options.location,
            salary_min: options.salary_min,
            salary_max: options.salary_max,
            description: options.description,
            status: options.status || 'active',
        });
    }

    async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
        return await this.repository.updateJob(id, updates);
    }

    // Candidate methods
    async getCandidates(filters?: { search?: string; limit?: number; offset?: number }): Promise<Candidate[]> {
        return await this.repository.findAllCandidates(filters);
    }

    async getCandidateById(id: string): Promise<Candidate> {
        const candidate = await this.repository.findCandidateById(id);
        if (!candidate) {
            throw new Error(`Candidate ${id} not found`);
        }
        return candidate;
    }

    async findOrCreateCandidate(
        email: string,
        fullName: string,
        linkedinUrl?: string
    ): Promise<Candidate> {
        let candidate = await this.repository.findCandidateByEmail(email);
        if (!candidate) {
            candidate = await this.repository.createCandidate({
                email,
                full_name: fullName,
                linkedin_url: linkedinUrl,
            });
        }
        return candidate;
    }

    // Application methods
    async getApplications(filters?: {
        recruiter_id?: string;
        job_id?: string;
        stage?: string
    }): Promise<Application[]> {
        return await this.repository.findApplications(filters);
    }

    async getApplicationById(id: string): Promise<Application> {
        const application = await this.repository.findApplicationById(id);
        if (!application) {
            throw new Error(`Application ${id} not found`);
        }
        return application;
    }

    async getApplicationsByJobId(jobId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByJobId(jobId);
    }

    async getApplicationsByRecruiterId(recruiterId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByRecruiterId(recruiterId);
    }

    async getApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByCandidateId(candidateId);
    }

    async submitCandidate(
        jobId: string,
        candidateEmail: string,
        candidateName: string,
        recruiterId?: string,
        options: {
            linkedin_url?: string;
            notes?: string;
        } = {}
    ): Promise<Application> {
        // Verify job exists
        await this.getJobById(jobId);

        // Find or create candidate
        const candidate = await this.findOrCreateCandidate(
            candidateEmail,
            candidateName,
            options.linkedin_url
        );

        // Create application
        const application = await this.repository.createApplication({
            job_id: jobId,
            candidate_id: candidate.id,
            recruiter_id: recruiterId,
            stage: 'submitted',
            notes: options.notes,
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.created',
            {
                application_id: application.id,
                job_id: jobId,
                candidate_id: candidate.id,
                recruiter_id: recruiterId,
            },
            'ats-service'
        );

        return application;
    }

    async updateApplicationStage(
        id: string,
        newStage: ApplicationStage,
        notes?: string
    ): Promise<Application> {
        const application = await this.getApplicationById(id);
        const oldStage = application.stage;

        const updated = await this.repository.updateApplication(id, {
            stage: newStage,
            notes: notes || application.notes,
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.stage_changed',
            {
                application_id: id,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                old_stage: oldStage,
                new_stage: newStage,
            },
            'ats-service'
        );

        return updated;
    }

    // Placement methods
    async getPlacements(filters?: {
        recruiter_id?: string;
        company_id?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<Placement[]> {
        return await this.repository.findAllPlacements(filters);
    }

    async getPlacementById(id: string): Promise<Placement> {
        const placement = await this.repository.findPlacementById(id);
        if (!placement) {
            throw new Error(`Placement ${id} not found`);
        }
        return placement;
    }

    async getPlacementsByRecruiterId(recruiterId: string): Promise<Placement[]> {
        return await this.repository.findPlacementsByRecruiterId(recruiterId);
    }

    async getPlacementsByCompanyId(companyId: string): Promise<Placement[]> {
        return await this.repository.findPlacementsByCompanyId(companyId);
    }

    async createPlacement(
        applicationId: string,
        salary: number,
        feePercentage: number
    ): Promise<Placement> {
        const application = await this.getApplicationById(applicationId);
        const job = await this.getJobById(application.job_id);

        if (!application.recruiter_id) {
            throw new Error('Application has no recruiter assigned');
        }

        // Calculate fee split (for Phase 1, simple 50/50 split)
        const feeAmount = (salary * feePercentage) / 100;
        const recruiterShare = feeAmount * 0.5;
        const platformShare = feeAmount * 0.5;

        const placement = await this.repository.createPlacement({
            job_id: job.id,
            candidate_id: application.candidate_id,
            company_id: job.company_id,
            recruiter_id: application.recruiter_id,
            application_id: applicationId,
            hired_at: new Date(),
            salary,
            fee_percentage: feePercentage,
            fee_amount: feeAmount,
            recruiter_share: recruiterShare,
            platform_share: platformShare,
        });

        // Update application stage to hired
        await this.updateApplicationStage(applicationId, 'hired');

        // Publish event
        await this.eventPublisher.publish(
            'placement.created',
            {
                placement_id: placement.id,
                job_id: job.id,
                candidate_id: application.candidate_id,
                company_id: job.company_id,
                recruiter_id: application.recruiter_id,
                salary,
                fee_amount: feeAmount,
                recruiter_share: recruiterShare,
            },
            'ats-service'
        );

        return placement;
    }

    // Stats methods
    async getStats(): Promise<{
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        totalPlacements: number
    }> {
        return await this.repository.getAtsStats();
    }
}
