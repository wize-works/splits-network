import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Jobs Routes (API Gateway)
 * 
 * Simple proxy - no business logic, no entity resolution.
 * Backend services handle filtering and authorization.
 */
export function registerJobsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const networkService = () => services.get('network');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // List jobs (unfiltered - use /api/roles for recruiter-filtered view)
    app.get('/api/jobs', {
        schema: {
            description: 'List all jobs (unfiltered)',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs?${queryString}` : '/jobs';
        const data = await atsService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get job by ID
    app.get('/api/jobs/:id', {
        schema: {
            description: 'Get job by ID',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().get(`/jobs/${id}`, undefined, correlationId);
        return reply.send(data);
    });

    // Create job (company admins and platform admins only)
    app.post('/api/jobs', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Create new job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);
        const data = await atsService().post('/jobs', request.body, correlationId);
        return reply.send(data);
    });

    // Update job (company admins and platform admins only)
    app.patch('/api/jobs/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
        schema: {
            description: 'Update job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().patch(`/jobs/${id}`, request.body);
        return reply.send(data);
    });

    // Get applications for a job
    // Filtering by user role is handled by the backend service
    app.get('/api/jobs/:jobId/applications', {
        schema: {
            description: 'Get applications for a job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { jobId } = request.params as { jobId: string };
        const correlationId = getCorrelationId(request);

        // Pass Clerk user ID to backend for filtering
        // Backend will handle role-based filtering (recruiters see their apps, companies see all)
        const data = await atsService().get(
            `/jobs/${jobId}/applications`, 
            undefined, 
            correlationId,
            {
                'x-clerk-user-id': req.auth.userId,
                'x-user-role': req.auth.memberships?.[0]?.role || 'candidate',
            }
        );
        return reply.send(data);
    });

    // Get recruiters assigned to a job
    app.get('/api/jobs/:jobId/recruiters', {
        schema: {
            description: 'Get recruiters assigned to a job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const data = await networkService().get(`/jobs/${jobId}/recruiters`);
        return reply.send(data);
    });

    // Get proposals for a job
    app.get('/api/jobs/:id/proposals', {
        schema: {
            description: 'Get proposals for a job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs/${id}/proposals?${queryString}` : `/jobs/${id}/proposals`;
        const data = await networkService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get pre-screen questions for a job
    app.get('/api/jobs/:jobId/pre-screen-questions', {
        schema: {
            description: 'Get pre-screen questions for a job',
            tags: ['jobs'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const data = await atsService().get(`/jobs/${jobId}/pre-screen-questions`);
        return reply.send(data);
    });
}
