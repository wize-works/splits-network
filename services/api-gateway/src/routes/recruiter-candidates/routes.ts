import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Recruiter-Candidate Relationship Routes
 * - Manages 12-month relationships between recruiters and candidates
 * - Invitation and consent management
 */
export function registerRecruiterCandidateRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const networkService = () => services.get('network');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // Get all candidates for current recruiter
    app.get('/api/recruiter-candidates/me', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Get all candidates for current recruiter',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        // Get recruiter ID for current user
        const recruiterResponse: any = await networkService().get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        if (!recruiterResponse.data) {
            return reply.status(404).send({ 
                error: 'Recruiter profile not found' 
            });
        }

        const recruiterId = recruiterResponse.data.id;
        const data = await networkService().get(
            `/recruiter-candidates/recruiter/${recruiterId}`,
            undefined,
            correlationId
        );
        
        return reply.send(data);
    });

    // Get all candidates for a specific recruiter (platform admins only) - must come before /:id routes
    app.get('/api/recruiter-candidates/recruiter/:recruiterId', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get all candidates for a recruiter',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().get(
            `/recruiter-candidates/recruiter/${recruiterId}`,
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Get all recruiters for a specific candidate (platform admins only) - must come before /:id routes
    app.get('/api/recruiter-candidates/candidate/:candidateId', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get all recruiters for a candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { candidateId } = request.params as { candidateId: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().get(
            `/recruiter-candidates/candidate/${candidateId}`,
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Renew recruiter-candidate relationship (recruiter or platform admin) - specific action routes before generic :id
    app.post('/api/recruiter-candidates/:id/renew', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Renew a recruiter-candidate relationship for another 12 months',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().post(
            `/recruiter-candidates/${id}/renew`,
            {},
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Resend invitation to candidate (recruiter or platform admin)
    app.post('/api/recruiter-candidates/:id/resend-invitation', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Resend invitation to candidate with new token and expiry',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().post(
            `/recruiter-candidates/${id}/resend-invitation`,
            {},
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Cancel invitation (recruiter or platform admin)
    app.post('/api/recruiter-candidates/:id/cancel-invitation', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Cancel a pending invitation',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().post(
            `/recruiter-candidates/${id}/cancel-invitation`,
            {},
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Terminate recruiter-candidate relationship (platform admin only) - specific action routes before generic :id
    app.patch('/api/recruiter-candidates/:id/terminate', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Terminate a recruiter-candidate relationship',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().patch(
            `/recruiter-candidates/${id}/terminate`,
            {},
            correlationId
        );
        return reply.send(data);
    });

    // Get invitation details by token (authenticated - user must be signed in to view)
    app.get('/api/network/recruiter-candidates/invitation/:token', {
        schema: {
            description: 'Get invitation details by token (requires authentication)',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { token } = request.params as { token: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().get(
            `/recruiter-candidates/invitation/${token}`,
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Accept invitation (authenticated - user must be signed in)
    app.post('/api/network/recruiter-candidates/invitation/:token/accept', {
        schema: {
            description: 'Accept recruiter invitation (requires authentication)',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { token } = request.params as { token: string };
        const correlationId = getCorrelationId(request);
        
        // Pass authenticated user info to service
        const data = await networkService().post(
            `/recruiter-candidates/invitation/${token}/accept`,
            { 
                userId: req.auth.userId,
                ...(request.body as Record<string, any> || {})
            },
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Decline invitation (authenticated - user must be signed in)
    app.post('/api/network/recruiter-candidates/invitation/:token/decline', {
        schema: {
            description: 'Decline recruiter invitation (requires authentication)',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { token } = request.params as { token: string };
        const correlationId = getCorrelationId(request);
        
        // Pass authenticated user info to service
        const data = await networkService().post(
            `/recruiter-candidates/invitation/${token}/decline`,
            { 
                userId: req.auth.userId,
                ...(request.body as Record<string, any> || {})
            },
            undefined,
            correlationId
        );
        return reply.send(data);
    });

    // Get specific recruiter-candidate relationship - this is the most generic route, register last
    app.get('/api/recruiter-candidates/:recruiterId/:candidateId', {
        schema: {
            description: 'Get recruiter-candidate relationship',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId, candidateId } = request.params as { recruiterId: string; candidateId: string };
        const correlationId = getCorrelationId(request);
        const data = await networkService().get(
            `/recruiter-candidates/${recruiterId}/${candidateId}`,
            undefined,
            correlationId
        );
        return reply.send(data);
    });
}
