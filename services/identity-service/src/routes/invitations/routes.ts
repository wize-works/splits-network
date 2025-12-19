/**
 * Invitations Routes
 * API endpoints for invitation management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InvitationsService } from '../../services/invitations/service';
import { BadRequestError } from '@splits-network/shared-fastify';

interface CreateInvitationBody {
    email: string;
    organization_id: string;
    role: 'company_admin' | 'hiring_manager' | 'recruiter';
    invited_by: string;
    clerk_invitation_id?: string;
}

interface AcceptInvitationBody {
    user_id: string;
}

export function registerInvitationsRoutes(
    app: FastifyInstance,
    service: InvitationsService
) {
    // Create invitation
    app.post(
        '/invitations',
        async (request: FastifyRequest<{ Body: CreateInvitationBody }>, reply: FastifyReply) => {
            const { email, organization_id, role, invited_by, clerk_invitation_id } = request.body;

            if (!email || !organization_id || !role || !invited_by) {
                throw new BadRequestError('Missing required fields');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new BadRequestError('Invalid email format');
            }

            // Validate role
            const validRoles = ['company_admin', 'hiring_manager', 'recruiter'];
            if (!validRoles.includes(role)) {
                throw new BadRequestError('Invalid role');
            }

            const invitation = await service.createInvitation({
                email: email.toLowerCase(),
                organization_id,
                role,
                invited_by,
                clerk_invitation_id,
            });

            return reply.status(201).send({ data: invitation });
        }
    );

    // Get invitation by ID
    app.get(
        '/invitations/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const invitation = await service.getInvitation(request.params.id);
            
            if (!invitation) {
                return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Invitation not found' } });
            }

            return reply.send({ data: invitation });
        }
    );

    // Get organization invitations
    app.get(
        '/organizations/:organizationId/invitations',
        async (request: FastifyRequest<{ Params: { organizationId: string } }>, reply: FastifyReply) => {
            const invitations = await service.getOrganizationInvitations(request.params.organizationId);
            return reply.send({ data: invitations });
        }
    );

    // Get pending invitations for email
    app.get(
        '/invitations/email/:email',
        async (request: FastifyRequest<{ Params: { email: string } }>, reply: FastifyReply) => {
            const invitations = await service.getPendingInvitationsForEmail(
                decodeURIComponent(request.params.email).toLowerCase()
            );
            return reply.send({ data: invitations });
        }
    );

    // Accept invitation
    app.post(
        '/invitations/:id/accept',
        async (request: FastifyRequest<{ Params: { id: string }; Body: AcceptInvitationBody }>, reply: FastifyReply) => {
            const { user_id } = request.body;

            if (!user_id) {
                throw new BadRequestError('user_id is required');
            }

            await service.acceptInvitation(request.params.id, user_id);
            return reply.status(204).send();
        }
    );

    // Revoke invitation
    app.post(
        '/invitations/:id/revoke',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            await service.revokeInvitation(request.params.id);
            return reply.status(204).send();
        }
    );

    // Delete invitation
    app.delete(
        '/invitations/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            await service.deleteInvitation(request.params.id);
            return reply.status(204).send();
        }
    );
}
