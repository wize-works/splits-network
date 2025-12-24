import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Recruiters Routes (API Gateway)
 * 
 * Simple proxy - no business logic, no entity resolution.
 * Backend services handle any necessary ID resolution.
 */
export function registerRecruitersRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const networkService = () => services.get('network');
    const atsService = () => services.get('ats');

    // Get current user's recruiter profile
    app.get('/api/recruiters/me', {
        schema: {
            description: 'Get current user recruiter profile',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const data = await networkService().get(`/recruiters/by-user/${req.auth.userId}`);
        return reply.send(data);
    });

    // List all recruiters (platform admins only)
    app.get('/api/recruiters', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'List all recruiters',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const data = await networkService().get('/recruiters');
        return reply.send(data);
    });

    // Get recruiter by ID
    app.get('/api/recruiters/:id', {
        schema: {
            description: 'Get recruiter by ID',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await networkService().get(`/recruiters/${id}`);
        return reply.send(data);
    });

    // Get recruiter stats
    app.get('/api/recruiters/:id/stats', {
        schema: {
            description: 'Get recruiter stats',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await networkService().get(`/recruiters/${id}/stats`);
        return reply.send(data);
    });

    // Create recruiter profile
    app.post('/api/recruiters', {
        schema: {
            description: 'Create recruiter profile',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const data = await networkService().post('/recruiters', {
            ...(request.body as any),
            user_id: req.auth.userId,
        });
        return reply.send(data);
    });

    // Get jobs assigned to recruiter
    app.get('/api/recruiters/:recruiterId/jobs', {
        schema: {
            description: 'Get jobs assigned to recruiter',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const data = await networkService().get(`/recruiters/${recruiterId}/jobs`);
        return reply.send(data);
    });

    // Get proposals for recruiter
    app.get('/api/recruiters/:id/proposals', {
        schema: {
            description: 'Get proposals for recruiter',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = (request as any).correlationId;
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/recruiters/${id}/proposals?${queryString}` : `/recruiters/${id}/proposals`;
        const data = await networkService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get proposed jobs for recruiter dashboard
    app.get('/api/recruiters/:recruiterId/proposed-jobs', {
        schema: {
            description: 'Get proposed jobs for recruiter dashboard',
            tags: ['recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const correlationId = (request as any).correlationId;
        
        // Pass recruiterId as-is to backend service
        // Backend will handle resolution if recruiterId is a Clerk user ID
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/recruiters/${recruiterId}/proposed-jobs?${queryString}` : `/recruiters/${recruiterId}/proposed-jobs`;
        const data = await atsService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get recruiters for a candidate - duplicated in the recruiter-candidates routes
    // app.get('/api/recruiter-candidates/candidate/:candidateId', {
    //     schema: {
    //         description: 'Get recruiters for a candidate',
    //         tags: ['recruiters'],
    //         security: [{ clerkAuth: [] }],
    //     },
    // }, async (request: FastifyRequest, reply: FastifyReply) => {
    //     const { candidateId } = request.params as { candidateId: string };
    //     const data = await networkService().get(`/recruiter-candidates/candidate/${candidateId}`);
    //     return reply.send(data);
    // });
}
