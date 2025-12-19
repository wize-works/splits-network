/**
 * Invitations Event Consumer
 * Listens for invitation events and sends emails
 */

import { NotificationService } from '../../service';
import { ServiceRegistry } from '../../clients';
import { Logger } from '@splits-network/shared-logging';

export class InvitationsConsumer {
    constructor(
        private notificationService: NotificationService,
        private serviceRegistry: ServiceRegistry,
        private logger: Logger,
        private portalUrl: string
    ) {}

    /**
     * Handle invitation.created event
     */
    async handleInvitationCreated(event: any): Promise<void> {
        const { invitation_id, email, organization_id, role, invited_by } = event;

        this.logger.info(
            { invitation_id, email, organization_id },
            'Processing invitation.created event'
        );

        try {
            // Fetch organization details
            const orgResponse: any = await this.serviceRegistry
                .getIdentityService()
                .get(`/organizations/${organization_id}`);
            const organization = orgResponse.data;

            // Fetch inviter details
            const inviterResponse: any = await this.serviceRegistry
                .getIdentityService()
                .get(`/users/${invited_by}`);
            const inviter = inviterResponse.data;

            // Fetch full invitation details (to get expires_at)
            const invitationResponse: any = await this.serviceRegistry
                .getIdentityService()
                .get(`/invitations/${invitation_id}`);
            const invitation = invitationResponse.data;

            // Build invitation link
            const invitation_link = `${this.portalUrl}/accept-invitation/${invitation_id}`;

            // Send invitation email
            await this.notificationService.invitations.sendInvitation({
                invitation_id,
                email,
                organization_name: organization.name,
                role,
                invited_by_name: inviter.full_name || inviter.email,
                invitation_link,
                expires_at: invitation.expires_at,
            });

            this.logger.info({ invitation_id, email }, 'Invitation email sent successfully');
        } catch (error) {
            this.logger.error(
                { error, invitation_id, email },
                'Failed to process invitation.created event'
            );
            throw error;
        }
    }

    /**
     * Handle invitation.revoked event
     */
    async handleInvitationRevoked(event: any): Promise<void> {
        const { email, organization_id } = event;

        this.logger.info({ email, organization_id }, 'Processing invitation.revoked event');

        try {
            // Fetch organization details
            const orgResponse: any = await this.serviceRegistry
                .getIdentityService()
                .get(`/organizations/${organization_id}`);
            const organization = orgResponse.data;

            // Send revoked email
            await this.notificationService.invitations.sendInvitationRevoked({
                email,
                organization_name: organization.name,
            });

            this.logger.info({ email, organization_id }, 'Revoked email sent successfully');
        } catch (error) {
            this.logger.error(
                { error, email, organization_id },
                'Failed to process invitation.revoked event'
            );
            // Don't throw - revocation already happened
        }
    }
}
