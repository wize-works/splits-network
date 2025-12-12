import { NetworkRepository } from './repository';
import { Recruiter, RoleAssignment, RecruiterStatus } from '@splits-network/shared-types';

export class NetworkService {
    constructor(private repository: NetworkRepository) { }

    // Recruiter methods
    async getRecruiterById(id: string): Promise<Recruiter> {
        const recruiter = await this.repository.findRecruiterById(id);
        if (!recruiter) {
            throw new Error(`Recruiter ${id} not found`);
        }
        return recruiter;
    }

    async getRecruiterByUserId(userId: string): Promise<Recruiter | null> {
        return await this.repository.findRecruiterByUserId(userId);
    }

    async getAllRecruiters(): Promise<Recruiter[]> {
        return await this.repository.findAllRecruiters();
    }

    async createRecruiter(userId: string, bio?: string): Promise<Recruiter> {
        return await this.repository.createRecruiter({
            user_id: userId,
            status: 'pending',
            bio,
        });
    }

    async updateRecruiterStatus(id: string, status: RecruiterStatus): Promise<Recruiter> {
        return await this.repository.updateRecruiter(id, { status });
    }

    async updateRecruiterBio(id: string, bio: string): Promise<Recruiter> {
        return await this.repository.updateRecruiter(id, { bio });
    }

    // Role assignment methods
    async getAssignedJobsForRecruiter(recruiterId: string): Promise<string[]> {
        const assignments = await this.repository.findRoleAssignmentsByRecruiterId(recruiterId);
        return assignments.map((a) => a.job_id);
    }

    async getAssignedRecruitersForJob(jobId: string): Promise<string[]> {
        const assignments = await this.repository.findRoleAssignmentsByJobId(jobId);
        return assignments.map((a) => a.recruiter_id);
    }

    async isRecruiterAssignedToJob(jobId: string, recruiterId: string): Promise<boolean> {
        const assignment = await this.repository.findRoleAssignment(jobId, recruiterId);
        return assignment !== null;
    }

    async assignRecruiterToJob(
        jobId: string,
        recruiterId: string,
        assignedBy?: string
    ): Promise<RoleAssignment> {
        // Verify recruiter exists and is active
        const recruiter = await this.getRecruiterById(recruiterId);
        if (recruiter.status !== 'active') {
            throw new Error(`Recruiter ${recruiterId} is not active`);
        }

        // Check if already assigned
        const existing = await this.repository.findRoleAssignment(jobId, recruiterId);
        if (existing) {
            return existing;
        }

        return await this.repository.createRoleAssignment({
            job_id: jobId,
            recruiter_id: recruiterId,
            assigned_by: assignedBy,
        });
    }

    async unassignRecruiterFromJob(jobId: string, recruiterId: string): Promise<void> {
        await this.repository.deleteRoleAssignment(jobId, recruiterId);
    }

    // Helper method for checking if a user has recruiter access
    async canUserAccessJob(userId: string, jobId: string): Promise<boolean> {
        const recruiter = await this.getRecruiterByUserId(userId);
        if (!recruiter || recruiter.status !== 'active') {
            return false;
        }

        return await this.isRecruiterAssignedToJob(jobId, recruiter.id);
    }
}
