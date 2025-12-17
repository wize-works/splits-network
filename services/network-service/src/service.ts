import { NetworkRepository } from './repository';
import { RecruiterService } from './services/recruiters/service';
import { AssignmentService } from './services/assignments/service';
import { StatsService } from './services/stats/service';
import { Recruiter, RecruiterStatus, RoleAssignment } from '@splits-network/shared-types';

/**
 * Main Network Service Coordinator
 * Instantiates and exposes domain services, provides delegation methods
 */
export class NetworkService {
    // Domain services
    public readonly recruiters: RecruiterService;
    public readonly assignments: AssignmentService;
    public readonly stats: StatsService;

    constructor(private repository: NetworkRepository) {
        // Initialize domain services
        this.recruiters = new RecruiterService(repository);
        this.assignments = new AssignmentService(repository);
        this.stats = new StatsService(repository);
    }

    // ========================================================================
    // Delegation methods for backward compatibility
    // ========================================================================

    // Recruiter methods
    async getRecruiterById(id: string): Promise<Recruiter> {
        return this.recruiters.getRecruiterById(id);
    }

    async getRecruiterByUserId(userId: string): Promise<Recruiter | null> {
        return this.recruiters.getRecruiterByUserId(userId);
    }

    async getAllRecruiters(): Promise<Recruiter[]> {
        return this.recruiters.getAllRecruiters();
    }

    async createRecruiter(userId: string, bio?: string): Promise<Recruiter> {
        return this.recruiters.createRecruiter(userId, bio);
    }

    async updateRecruiterStatus(id: string, status: RecruiterStatus): Promise<Recruiter> {
        return this.recruiters.updateRecruiterStatus(id, status);
    }

    async updateRecruiterBio(id: string, bio: string): Promise<Recruiter> {
        return this.recruiters.updateRecruiterBio(id, bio);
    }

    async getRecruiterStats(id: string): Promise<{
        submissions_count: number;
        placements_count: number;
        total_earnings: number;
    }> {
        return this.recruiters.getRecruiterStats(id);
    }

    // Assignment methods
    async getAssignedJobsForRecruiter(recruiterId: string): Promise<string[]> {
        return this.assignments.getAssignedJobsForRecruiter(recruiterId);
    }

    async getAssignedRecruitersForJob(jobId: string): Promise<string[]> {
        return this.assignments.getAssignedRecruitersForJob(jobId);
    }

    async isRecruiterAssignedToJob(jobId: string, recruiterId: string): Promise<boolean> {
        return this.assignments.isRecruiterAssignedToJob(jobId, recruiterId);
    }

    async assignRecruiterToJob(
        jobId: string,
        recruiterId: string,
        assignedBy?: string
    ): Promise<RoleAssignment> {
        return this.assignments.assignRecruiterToJob(jobId, recruiterId, assignedBy);
    }

    async unassignRecruiterFromJob(jobId: string, recruiterId: string): Promise<void> {
        return this.assignments.unassignRecruiterFromJob(jobId, recruiterId);
    }

    // Helper method for checking if a user has recruiter access
    async canUserAccessJob(userId: string, jobId: string): Promise<boolean> {
        const recruiter = await this.getRecruiterByUserId(userId);
        if (!recruiter || recruiter.status !== 'active') {
            return false;
        }

        return await this.isRecruiterAssignedToJob(jobId, recruiter.id);
    }

    // Stats methods
    async getStats(): Promise<{ totalRecruiters: number; activeRecruiters: number; pendingRecruiters: number }> {
        return this.stats.getStats();
    }

    // Recruiter-Candidate Relationship methods
    async findRecruiterCandidateRelationship(recruiterId: string, candidateId: string) {
        return this.repository.findRecruiterCandidateRelationship(recruiterId, candidateId);
    }

    async createRecruiterCandidateRelationship(recruiterId: string, candidateId: string) {
        return this.repository.createRecruiterCandidateRelationship(recruiterId, candidateId);
    }

    async findCandidatesByRecruiterId(recruiterId: string) {
        return this.repository.findCandidatesByRecruiterId(recruiterId);
    }

    async updateRecruiterCandidateRelationship(id: string, updates: any) {
        return this.repository.updateRecruiterCandidateRelationship(id, updates);
    }

    async renewRecruiterCandidateRelationship(id: string) {
        return this.repository.renewRecruiterCandidateRelationship(id);
    }
}
