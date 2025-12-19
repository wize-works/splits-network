/**
 * Invitations Service
 * Handles organization invitation management with Clerk integration
 */

import { IdentityRepository } from '../../repository';
import { EventPublisher } from '../../events';

export interface InvitationInput {
    email: string;
    organization_id: string;
    role: 'company_admin' | 'hiring_manager' | 'recruiter';
    invited_by: string;
    clerk_invitation_id?: string;
}

export interface Invitation {
    id: string;
    email: string;
    organization_id: string;
    role: string;
    invited_by: string;
    clerk_invitation_id: string | null;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
}

export class InvitationsService {
    constructor(
        private repository: IdentityRepository,
        private eventPublisher?: EventPublisher
    ) {}

    /**
     * Create a new invitation
     */
    async createInvitation(input: InvitationInput): Promise<Invitation> {
        // Check if there's already a pending invitation for this email/org
        const existing = await this.repository.findPendingInvitationByEmailAndOrg(
            input.email,
            input.organization_id
        );

        if (existing) {
            throw new Error('An invitation for this email already exists for this organization');
        }

        // Create the invitation in our database
        const invitation = await this.repository.createInvitation(input);

        // Publish event for notification service
        if (this.eventPublisher) {
            await this.eventPublisher.publish('invitation.created', {
                invitation_id: invitation.id,
                email: invitation.email,
                organization_id: invitation.organization_id,
                role: invitation.role,
                invited_by: invitation.invited_by,
            }, 'identity-service');
        }

        return invitation;
    }

    /**
     * Get invitation by ID
     */
    async getInvitation(id: string): Promise<Invitation | null> {
        return await this.repository.findInvitationById(id);
    }

    /**
     * Get invitation by Clerk invitation ID
     */
    async getInvitationByClerkId(clerkInvitationId: string): Promise<Invitation | null> {
        return await this.repository.findInvitationByClerkId(clerkInvitationId);
    }

    /**
     * Get all invitations for an organization
     */
    async getOrganizationInvitations(organizationId: string): Promise<Invitation[]> {
        return await this.repository.findInvitationsByOrganization(organizationId);
    }

    /**
     * Get pending invitations for an email
     */
    async getPendingInvitationsForEmail(email: string): Promise<Invitation[]> {
        return await this.repository.findPendingInvitationsByEmail(email);
    }

    /**
     * Accept an invitation
     */
    async acceptInvitation(id: string, userId: string): Promise<void> {
        const invitation = await this.repository.findInvitationById(id);
        
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Invitation is not pending');
        }

        if (new Date(invitation.expires_at) < new Date()) {
            // Mark as expired
            await this.repository.updateInvitation(id, { status: 'expired' });
            throw new Error('Invitation has expired');
        }

        // Create membership
        await this.repository.createMembership({
            user_id: userId,
            organization_id: invitation.organization_id,
            role: invitation.role as any,
        });

        // Mark invitation as accepted
        await this.repository.updateInvitation(id, {
            status: 'accepted',
            accepted_at: new Date().toISOString(),
        });
    }

    /**
     * Revoke an invitation
     */
    async revokeInvitation(id: string): Promise<void> {
        const invitation = await this.repository.findInvitationById(id);
        if (!invitation) {
            throw new Error('Invitation not found');
        }

        await this.repository.updateInvitation(id, { status: 'revoked' });

        // Publish event for notification service
        if (this.eventPublisher) {
            await this.eventPublisher.publish('invitation.revoked', {
                invitation_id: id,
                email: invitation.email,
                organization_id: invitation.organization_id,
            }, 'identity-service');
        }
    }

    /**
     * Delete an invitation
     */
    async deleteInvitation(id: string): Promise<void> {
        await this.repository.deleteInvitation(id);
    }

    /**
     * Clean up expired invitations
     */
    async cleanupExpiredInvitations(): Promise<number> {
        return await this.repository.deleteExpiredInvitations();
    }
}
