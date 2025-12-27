import { NetworkRepository } from '../../repository';
import { Recruiter, RecruiterStatus } from '@splits-network/shared-types';
import { AtsClient } from '../../clients';

/**
 * Recruiter Service
 * Handles recruiter profile management and statistics
 */
export class RecruiterService {
    private atsClient: AtsClient;

    constructor(private repository: NetworkRepository) {
        this.atsClient = new AtsClient();
    }

    async getRecruiterById(id: string): Promise<Recruiter> {
        const recruiter = await this.repository.findRecruiterById(id);
        if (!recruiter) {
            throw new Error(`Recruiter ${id} not found`);
        }
        return recruiter;
    }

    async getRecruiterByClerkUserId(clerkUserId: string): Promise<Recruiter | null> {
        return await this.repository.findRecruiterByClerkUserId(clerkUserId);
    }

    async getAllRecruiters(): Promise<Recruiter[]> {
        return await this.repository.findAllRecruiters();
    }

    async createRecruiter(
        clerkUserId: string,
        profileData?: {
            status?: 'pending' | 'active' | 'suspended';
            bio?: string;
            industries?: string[];
            specialties?: string[];
            location?: string;
            tagline?: string;
            years_experience?: number;
        }
    ): Promise<Recruiter> {
        return await this.repository.createRecruiter({
            user_id: clerkUserId,
            status: profileData?.status || 'pending',
            bio: profileData?.bio,
            industries: profileData?.industries,
            specialties: profileData?.specialties,
            location: profileData?.location,
            tagline: profileData?.tagline,
            years_experience: profileData?.years_experience,
        });
    }

    async updateRecruiterStatus(id: string, status: RecruiterStatus): Promise<Recruiter> {
        return await this.repository.updateRecruiter(id, { status });
    }

    async updateRecruiterBio(id: string, bio: string): Promise<Recruiter> {
        return await this.repository.updateRecruiter(id, { bio });
    }

    async getRecruiterStats(id: string): Promise<{
        submissions_count: number;
        placements_count: number;
        total_earnings: number;
    }> {
        // Verify recruiter exists
        const recruiter = await this.getRecruiterById(id);

        // Fetch applications (submissions) and placements from ATS service
        const [applications, placements] = await Promise.all([
            this.atsClient.getApplicationsByRecruiterId(id),
            this.atsClient.getPlacementsByRecruiterId(id),
        ]);

        // Calculate total earnings from placements
        const totalEarnings = placements.reduce((sum, placement) => {
            return sum + (placement.recruiter_share || 0);
        }, 0);

        return {
            submissions_count: applications.length,
            placements_count: placements.length,
            total_earnings: totalEarnings,
        };
    }
}
