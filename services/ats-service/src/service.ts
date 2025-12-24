import { AtsRepository } from './repository';
import { EventPublisher } from './events';
import { CompanyService } from './services/companies/service';
import { JobService } from './services/jobs/service';
import { CandidateService } from './services/candidates/service';
import { ApplicationService } from './services/applications/service';
import { PlacementService } from './services/placements/service';
import { StatsService } from './services/stats/service';

/**
 * Main ATS Service - coordinates all domain services
 */
export class AtsService {
    public readonly companies: CompanyService;
    public readonly jobs: JobService;
    public readonly candidates: CandidateService;
    public readonly applications: ApplicationService;
    public readonly placements: PlacementService;
    public readonly stats: StatsService;

    constructor(
        private repository: AtsRepository,
        private eventPublisher: EventPublisher
    ) {
        // Initialize domain services
        this.companies = new CompanyService(repository);
        this.jobs = new JobService(repository);
        this.candidates = new CandidateService(repository);
        this.applications = new ApplicationService(repository, eventPublisher, this.candidates);
        this.placements = new PlacementService(repository, eventPublisher, this.applications);
        this.stats = new StatsService(repository);
    }

    // Delegate to domain services for backward compatibility
    // Companies
    async getCompanies() { return this.companies.getCompanies(); }
    async getCompanyById(id: string) { return this.companies.getCompanyById(id); }
    async getCompanyByOrgId(orgId: string) { return this.companies.getCompanyByOrgId(orgId); }
    async createCompany(name: string, identityOrgId?: string, profileFields?: any) { return this.companies.createCompany(name, identityOrgId, profileFields); }
    async updateCompany(id: string, updates: any) { return this.companies.updateCompany(id, updates); }

    // Jobs
    async getJobs(filters?: { 
        status?: string; 
        search?: string;
        location?: string;
        employment_type?: string;
        open_to_relocation?: boolean;
        salary_min?: number;
        limit?: number; 
        offset?: number;
    }) { return this.jobs.getJobs(filters); }
    async getJobById(id: string) { return this.jobs.getJobById(id); }
    async getJobsByCompanyId(companyId: string) { return this.jobs.getJobsByCompanyId(companyId); }
    async getJobsByIds(ids: string[]) { return this.jobs.getJobsByIds(ids); }
    async createJob(companyId: string, title: string, feePercentage: number, options?: any) { return this.jobs.createJob(companyId, title, feePercentage, options); }
    async updateJob(id: string, updates: any) { return this.jobs.updateJob(id, updates); }

    // Candidates
    async getCandidates(filters?: { search?: string; limit?: number; offset?: number; recruiter_id?: string }) { return this.candidates.getCandidates(filters); }
    async getCandidateById(id: string) { return this.candidates.getCandidateById(id); }
    async findOrCreateCandidate(email: string, fullName: string, linkedinUrl?: string, recruiterId?: string) { return this.candidates.findOrCreateCandidate(email, fullName, linkedinUrl, recruiterId); }
    async updateCandidate(id: string, updates: { full_name?: string; email?: string; linkedin_url?: string; github_url?: string; portfolio_url?: string; phone?: string; location?: string; current_title?: string; current_company?: string; bio?: string; skills?: string }) { return this.candidates.updateCandidate(id, updates); }
    async getCandidateForCompany(candidateId: string, companyId: string) { return this.candidates.getCandidateForCompany(candidateId, companyId); }
    async linkCandidateToUser(candidateId: string, userId: string) { return this.repository.linkCandidateToUser(candidateId, userId); }

    // Applications
    async getApplications(filters?: { recruiter_id?: string; job_id?: string; stage?: string }) { return this.applications.getApplications(filters); }
    async getApplicationsPaginated(params: any, correlationId?: string) { return this.applications.getApplicationsPaginated(params, correlationId); }
    async getApplicationById(id: string) { return this.applications.getApplicationById(id); }
    async getApplicationsByJobId(jobId: string) { return this.applications.getApplicationsByJobId(jobId); }
    async getApplicationsByRecruiterId(recruiterId: string) { return this.applications.getApplicationsByRecruiterId(recruiterId); }
    async getApplicationsByCandidateId(candidateId: string) { return this.applications.getApplicationsByCandidateId(candidateId); }
    async submitCandidate(jobId: string, email: string, name: string, recruiterId?: string, options?: any) { return this.applications.submitCandidate(jobId, email, name, recruiterId, options); }
    async updateApplicationStage(id: string, stage: any, notes?: string, auditContext?: any) { return this.applications.updateApplicationStage(id, stage, notes, auditContext); }
    async addApplicationNote(id: string, note: string, auditContext?: any) { return this.applications.addApplicationNote(id, note, auditContext); }
    async acceptApplication(applicationId: string, auditContext?: any) { return this.applications.acceptApplication(applicationId, auditContext); }
    async getApplicationsForCompany(companyId: string, filters?: any) { return this.applications.getApplicationsForCompany(companyId, filters); }
    async getApplicationAuditLog(applicationId: string) { return this.applications.getApplicationAuditLog(applicationId); }
    async getCompanyAuditLogs(companyId: string, limit?: number) { return this.applications.getCompanyAuditLogs(companyId, limit); }
    
    // New candidate application workflow methods
    async submitCandidateApplication(params: any) { return this.applications.submitCandidateApplication(params); }
    async recruiterSubmitApplication(applicationId: string, recruiterId: string, options?: any) { return this.applications.recruiterSubmitApplication(applicationId, recruiterId, options); }
    async withdrawApplication(applicationId: string, candidateId: string, candidateUserId?: string, reason?: string) { return this.applications.withdrawApplication(applicationId, candidateId, candidateUserId, reason); }
    async getPendingApplicationsForRecruiter(recruiterId: string) { return this.applications.getPendingApplicationsForRecruiter(recruiterId); }
    async requestPreScreen(applicationId: string, companyId: string, requestedByUserId: string, options?: { recruiter_id?: string; message?: string }) { return this.applications.requestPreScreen(applicationId, companyId, requestedByUserId, options); }
    
    // Recruiter submission flow methods
    async recruiterProposeJob(params: { recruiterId: string; recruiterUserId: string; candidateId: string; jobId: string; pitch?: string }) { return this.applications.recruiterProposeJob(params); }
    async candidateApproveOpportunity(params: { applicationId: string; candidateId: string; candidateUserId: string }) { return this.applications.candidateApproveOpportunity(params); }
    async candidateDeclineOpportunity(params: { applicationId: string; candidateId: string; candidateUserId: string; reason?: string; notes?: string }) { return this.applications.candidateDeclineOpportunity(params); }
    async getPendingOpportunitiesForCandidate(candidateId: string) { return this.applications.getPendingOpportunitiesForCandidate(candidateId); }
    async getProposedJobsForRecruiter(recruiterId: string) { return this.applications.getProposedJobsForRecruiter(recruiterId); }
    
    // Pre-screen methods
    async getPreScreenQuestionsForJob(jobId: string) { return this.repository.getPreScreenQuestionsForJob(jobId); }
    async getPreScreenAnswersForApplication(applicationId: string) { return this.repository.getPreScreenAnswersForApplication(applicationId); }
    
    // Document methods  
    async getDocumentsForApplication(applicationId: string) { return this.repository.getDocumentsForApplication(applicationId); }

    // Placements
    async getPlacements(filters?: any) { return this.placements.getPlacements(filters); }
    async getPlacementById(id: string) { return this.placements.getPlacementById(id); }
    async getPlacementsByRecruiterId(recruiterId: string) { return this.placements.getPlacementsByRecruiterId(recruiterId); }
    async getPlacementsByCompanyId(companyId: string) { return this.placements.getPlacementsByCompanyId(companyId); }
    async createPlacement(applicationId: string, salary: number, feePercentage: number) { return this.placements.createPlacement(applicationId, salary, feePercentage); }

    // Stats
    async getStats() { return this.stats.getStats(); }
}

