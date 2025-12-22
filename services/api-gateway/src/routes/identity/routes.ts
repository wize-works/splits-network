import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles } from '../../rbac';
import { clearUserContextCache } from '../../routes';

/**
 * Identity Routes
 * - User profile (/me)
 * - User consent (cookie/privacy preferences)
 * - Organization memberships
 * - Invitations
 */
export function registerIdentityRoutes(app: FastifyInstance, services: ServiceRegistry) {
    /**
     * Get current user profile
     */
    app.get('/api/me', {
        schema: {
            description: 'Get current user profile',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const profile = await identityService.get(`/users/${req.auth.userId}`, undefined, correlationId);
        return reply.send(profile);
    });

    /**
     * Update current user profile
     */
    app.patch('/api/me', {
        schema: {
            description: 'Update current user profile',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const updatedProfile = await identityService.patch(`/users/${req.auth.userId}`, request.body, correlationId);
        return reply.send(updatedProfile);
    });

    /**
     * Update user onboarding step
     */
    app.patch('/api/users/:id/onboarding', {
        schema: {
            description: 'Update user onboarding progress',
            tags: ['identity', 'onboarding'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const result = await identityService.patch(`/users/${id}/onboarding`, request.body, correlationId);
        return reply.send(result);
    });

    /**
     * Complete user onboarding
     */
    app.post('/api/users/:id/complete-onboarding', {
        schema: {
            description: 'Complete user onboarding wizard',
            tags: ['identity', 'onboarding'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const result = await identityService.post(`/users/${id}/complete-onboarding`, request.body, correlationId);
        
        // Clear user context cache so new membership is immediately available
        // This ensures the user can access role-specific endpoints right away
        if (req.auth?.clerkUserId) {
            clearUserContextCache(req.auth.clerkUserId);
        }
        
        return reply.send(result);
    });

    /**
     * Change user password
     */
    app.post('/api/auth/change-password', {
        schema: {
            description: 'Change current user password',
            tags: ['identity', 'auth'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const result = await identityService.post(`/users/${req.auth.userId}/change-password`, request.body, correlationId);
        return reply.send(result);
    });

    /**
     * Get current user's consent preferences
     */
    app.get('/api/consent', {
        schema: {
            description: 'Get current user cookie consent preferences',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const consent = await identityService.get('/consent', { userId: req.auth.userId }, correlationId);
        return reply.send(consent);
    });

    /**
     * Save or update user's consent preferences
     */
    app.post('/api/consent', {
        schema: {
            description: 'Save or update user cookie consent preferences',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const consent = await identityService.post('/consent', request.body, correlationId);
        return reply.status(201).send(consent);
    });

    /**
     * Get organization memberships
     */
    app.get('/api/organizations/:organizationId/memberships', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
        schema: {
            description: 'Get organization memberships',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { organizationId } = request.params as { organizationId: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const memberships = await identityService.get(`/organizations/${organizationId}/memberships`, undefined, correlationId);
        return reply.send(memberships);
    });

    /**
     * Create invitation
     */
    app.post('/api/invitations', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Create invitation',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const invitation = await identityService.post('/invitations', request.body, correlationId);
        return reply.status(201).send(invitation);
    });

    /**
     * Get organization invitations
     */
    app.get('/api/organizations/:organizationId/invitations', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
        schema: {
            description: 'Get organization invitations',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { organizationId } = request.params as { organizationId: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const invitations = await identityService.get(`/organizations/${organizationId}/invitations`, undefined, correlationId);
        return reply.send(invitations);
    });

    /**
     * Get invitation details (public - no auth required)
     */
    app.get('/api/invitations/:id', {
        schema: {
            description: 'Get invitation details (public)',
            tags: ['identity'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        const invitation = await identityService.get(`/invitations/${id}`, undefined, correlationId);
        return reply.send(invitation);
    });

    /**
     * Accept invitation (requires auth)
     */
    app.post('/api/invitations/:id/accept', {
        schema: {
            description: 'Accept invitation',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as any;
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        await identityService.post(`/invitations/${id}/accept`, {
            user_id: req.auth.userId,
        }, correlationId);
        
        return reply.status(200).send({ data: { success: true } });
    });

    /**
     * Revoke invitation
     */
    app.post('/api/invitations/:id/revoke', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Revoke invitation',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        await identityService.post(`/invitations/${id}/revoke`, {}, correlationId);
        return reply.status(204).send();
    });

    /**
     * Delete invitation
     */
    app.delete('/api/invitations/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Delete invitation',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        await identityService.delete(`/invitations/${id}`, correlationId);
        return reply.status(204).send();
    });

    /**
     * Delete membership
     */
    app.delete('/api/memberships/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Delete membership',
            tags: ['identity'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const correlationId = (request as any).correlationId;

        await identityService.delete(`/memberships/${id}`, correlationId);
        return reply.status(204).send();
    });
}
