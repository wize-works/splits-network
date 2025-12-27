import { NetworkRepository } from './repository';
import { RecruiterService } from './services/recruiters/service';
import { AssignmentService } from './services/assignments/service';
import { StatsService } from './services/stats/service';
import { EventPublisher } from './events';
import { Recruiter, RecruiterStatus, RoleAssignment } from '@splits-network/shared-types';
import { AtsClient } from './clients';

/**
 * Main Network Service Coordinator
 * Instantiates and exposes domain services, provides delegation methods
 */
export class NetworkService {
    // Domain services
    public readonly recruiters: RecruiterService;
    public readonly assignments: AssignmentService;
    public readonly stats: StatsService;
    private atsClient: AtsClient;

    constructor(
        private repository: NetworkRepository,
        private eventPublisher?: EventPublisher
    ) {
        // Initialize domain services
        this.recruiters = new RecruiterService(repository);
        this.assignments = new AssignmentService(repository);
        this.stats = new StatsService(repository);
        this.atsClient = new AtsClient();
    }

    // ========================================================================
    // Delegation methods for backward compatibility
    // ========================================================================

    // Recruiter methods
    async getRecruiterById(id: string): Promise<Recruiter> {
        return this.recruiters.getRecruiterById(id);
    }

    async getRecruiterByClerkUserId(clerkUserId: string): Promise<Recruiter | null> {
        return this.recruiters.getRecruiterByClerkUserId(clerkUserId);
    }

    async getAllRecruiters(): Promise<Recruiter[]> {
        return this.recruiters.getAllRecruiters();
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
        return this.recruiters.createRecruiter(clerkUserId, profileData);
    }

    async updateRecruiterStatus(id: string, status: RecruiterStatus): Promise<Recruiter> {
        return this.recruiters.updateRecruiterStatus(id, status);
    }

    async updateRecruiterBio(id: string, bio: string): Promise<Recruiter> {
        return this.recruiters.updateRecruiterBio(id, bio);
    }

    async updateRecruiter(id: string, updates: Partial<Recruiter>): Promise<Recruiter> {
        return this.repository.updateRecruiter(id, updates);
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
    async canUserAccessJob(clerkUserId: string, jobId: string): Promise<boolean> {
        const recruiter = await this.getRecruiterByClerkUserId(clerkUserId);
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
    async getRecruiterCandidateRelationship(recruiterId: string, candidateId: string) {
        return this.repository.findRecruiterCandidateRelationship(recruiterId, candidateId);
    }

    async createRecruiterCandidateRelationship(data: {
        recruiter_id: string;
        candidate_id: string;
        relationship_start_date: string;
        relationship_end_date: string;
        status: 'active' | 'expired' | 'terminated';
    }) {
        // Create relationship with invitation token
        const relationship = await this.repository.createRecruiterCandidateRelationship(
            data.recruiter_id, 
            data.candidate_id
        );

        // Emit candidate.invited event for notification service
        if (this.eventPublisher) {
            await this.eventPublisher.publish('candidate.invited', {
                relationship_id: relationship.id,
                recruiter_id: data.recruiter_id,
                candidate_id: data.candidate_id,
                invitation_token: relationship.invitation_token,
                invitation_expires_at: relationship.invitation_expires_at,
            }, 'network-service');
        }

        return relationship;
    }

    async findCandidatesByRecruiterId(recruiterId: string) {
        return this.repository.findCandidatesByRecruiterId(recruiterId);
    }

    async findRecruitersByCandidateId(candidateId: string) {
        return this.repository.findRecruitersByCandidateId(candidateId);
    }

    async updateRecruiterCandidateRelationship(id: string, updates: any) {
        return this.repository.updateRecruiterCandidateRelationship(id, updates);
    }

    async renewRecruiterCandidateRelationship(id: string) {
        return this.repository.renewRecruiterCandidateRelationship(id);
    }

    // Invitation consent methods
    async getRelationshipByInvitationToken(token: string) {
        return this.repository.findRecruiterCandidateByToken(token);
    }

    async acceptInvitation(token: string, metadata: {
        user_id?: string;
        ip_address: string;
        user_agent: string;
    }) {
        const relationship = await this.repository.findRecruiterCandidateByToken(token);
        
        if (!relationship) {
            throw new Error('Invitation not found');
        }
        
        // Check if expired
        if (relationship.invitation_expires_at && new Date(relationship.invitation_expires_at) < new Date()) {
            throw new Error('Invitation has expired');
        }
        
        // Check if already processed
        if (relationship.consent_given === true) {
            throw new Error('Invitation has already been accepted');
        }
        
        if (relationship.declined_at) {
            throw new Error('Invitation has already been declined');
        }
        
        // Update with consent
        const updatedRelationship = await this.repository.updateRecruiterCandidateRelationship(relationship.id, {
            consent_given: true,
            consent_given_at: new Date(),
            consent_ip_address: metadata.ip_address,
            consent_user_agent: metadata.user_agent,
        });

        // Link candidate to user account and verify them
        if (metadata.user_id && relationship.candidate_id) {
            try {
                await this.atsClient.linkCandidateToUser(relationship.candidate_id, metadata.user_id);
            } catch (error: any) {
                console.error('Failed to link candidate to user:', error.message);
                // Don't fail the invitation acceptance if linking fails
            }
        }

        // Emit consent given event for recruiter notification
        if (this.eventPublisher) {
            await this.eventPublisher.publish('candidate.consent_given', {
                relationship_id: updatedRelationship.id,
                recruiter_id: updatedRelationship.recruiter_id,
                candidate_id: updatedRelationship.candidate_id,
                consent_given_at: updatedRelationship.consent_given_at,
            }, 'network-service');
        }

        return updatedRelationship;
    }

    async declineInvitation(token: string, metadata: {
        reason?: string;
        ip_address: string;
        user_agent: string;
    }) {
        const relationship = await this.repository.findRecruiterCandidateByToken(token);
        
        if (!relationship) {
            throw new Error('Invitation not found');
        }
        
        // Check if already processed
        if (relationship.consent_given === true) {
            throw new Error('Invitation has already been accepted');
        }
        
        if (relationship.declined_at) {
            throw new Error('Invitation has already been declined');
        }
        
        // Update with decline
        const updatedRelationship = await this.repository.updateRecruiterCandidateRelationship(relationship.id, {
            consent_given: false,
            declined_at: new Date(),
            declined_reason: metadata.reason,
            consent_ip_address: metadata.ip_address,
            consent_user_agent: metadata.user_agent,
        });

        // Emit consent declined event for recruiter notification
        if (this.eventPublisher) {
            await this.eventPublisher.publish('candidate.consent_declined', {
                relationship_id: updatedRelationship.id,
                recruiter_id: updatedRelationship.recruiter_id,
                candidate_id: updatedRelationship.candidate_id,
                declined_at: updatedRelationship.declined_at,
                declined_reason: updatedRelationship.declined_reason,
            }, 'network-service');
        }

        return updatedRelationship;
    }

    async resendInvitation(relationshipId: string) {
        // Get the relationship
        const relationship = await this.repository.getRecruiterCandidateRelationshipById(relationshipId);
        
        if (!relationship) {
            throw new Error('Relationship not found');
        }

        // Can only resend if not yet accepted or declined
        if (relationship.consent_given === true) {
            throw new Error('Cannot resend invitation - candidate has already accepted');
        }

        if (relationship.declined_at) {
            throw new Error('Cannot resend invitation - candidate has already declined');
        }

        // Resend invitation with new token and expiry
        const updatedRelationship = await this.repository.resendInvitation(relationshipId);

        // Emit candidate.invited event for notification service
        if (this.eventPublisher) {
            await this.eventPublisher.publish('candidate.invited', {
                relationship_id: updatedRelationship.id,
                recruiter_id: updatedRelationship.recruiter_id,
                candidate_id: updatedRelationship.candidate_id,
                invitation_token: updatedRelationship.invitation_token,
                invitation_expires_at: updatedRelationship.invitation_expires_at,
                resend: true,
            }, 'network-service');
        }

        return updatedRelationship;
    }

    async cancelInvitation(relationshipId: string) {
        // Get the relationship
        const relationship = await this.repository.getRecruiterCandidateRelationshipById(relationshipId);
        
        if (!relationship) {
            throw new Error('Relationship not found');
        }

        // Can only cancel if not yet accepted
        if (relationship.consent_given === true) {
            throw new Error('Cannot cancel invitation - candidate has already accepted');
        }

        // Terminate the relationship (this removes recruiter's access)
        const updatedRelationship = await this.repository.updateRecruiterCandidateRelationship(relationshipId, {
            status: 'terminated',
        });

        // Emit invitation cancelled event
        if (this.eventPublisher) {
            await this.eventPublisher.publish('candidate.invitation_cancelled', {
                relationship_id: updatedRelationship.id,
                recruiter_id: updatedRelationship.recruiter_id,
                candidate_id: updatedRelationship.candidate_id,
            }, 'network-service');
        }

        return updatedRelationship;
    }

    // ========================================================================
    // Marketplace Methods
    // ========================================================================

    async getMarketplaceConfig(key: string) {
        return this.repository.getMarketplaceConfig(key);
    }

    async searchMarketplaceRecruiters(filters: any) {
        return this.repository.searchMarketplaceRecruiters(filters);
    }

    async getMarketplaceRecruiter(recruiterId: string) {
        return this.repository.getMarketplaceRecruiter(recruiterId);
    }

    async getRecruiterReputation(recruiterId: string) {
        return this.repository.getRecruiterReputation(recruiterId);
    }

    async createMarketplaceConnection(data: {
        candidate_user_id: string;
        recruiter_id: string;
        message?: string;
    }) {
        return this.repository.createMarketplaceConnection(data);
    }

    async findMarketplaceConnection(candidateUserId: string, recruiterId: string) {
        return this.repository.findMarketplaceConnection(candidateUserId, recruiterId);
    }

    async getMarketplaceConnectionById(connectionId: string) {
        return this.repository.getMarketplaceConnectionById(connectionId);
    }

    async listCandidateConnections(candidateUserId: string) {
        return this.repository.listCandidateConnections(candidateUserId);
    }

    async listRecruiterConnections(recruiterId: string) {
        return this.repository.listRecruiterConnections(recruiterId);
    }

    async updateMarketplaceConnection(connectionId: string, updates: any) {
        return this.repository.updateMarketplaceConnection(connectionId, updates);
    }

    async createMarketplaceMessage(data: {
        connection_id: string;
        sender_user_id: string;
        sender_type: 'candidate' | 'recruiter';
        message: string;
    }) {
        return this.repository.createMarketplaceMessage(data);
    }

    async listConnectionMessages(connectionId: string) {
        return this.repository.listConnectionMessages(connectionId);
    }

    async markConnectionMessagesAsRead(connectionId: string, userIdNotSender: string) {
        return this.repository.markConnectionMessagesAsRead(connectionId, userIdNotSender);
    }

    async getUnreadMessageCount(connectionId: string, userIdNotSender: string) {
        return this.repository.getUnreadMessageCount(connectionId, userIdNotSender);
    }
}

