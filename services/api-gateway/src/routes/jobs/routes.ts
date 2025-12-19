import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest, isRecruiter } from '../../rbac';

/**
 * Jobs Routes
 * - Job CRUD operations
 * - Job-related endpoints (applications, proposals, recruiters)
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
    // RBAC: Recruiters only see their own submissions, companies/admins see all
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

        // Get all applications from ATS
        const applicationsResponse: any = await atsService().get(`/jobs/${jobId}/applications`, undefined, correlationId);
        let applications = applicationsResponse.data || [];

        // If user is a recruiter, filter to only their submissions
        if (isRecruiter(req.auth)) {
            try {
                // Get recruiter ID for this user
                const recruiterResponse: any = await networkService().get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );

                if (recruiterResponse.data) {
                    const recruiterId = recruiterResponse.data.id;
                    // Filter applications to only those submitted by this recruiter
                    applications = applications.filter((app: any) => app.recruiter_id === recruiterId);
                } else {
                    // No recruiter record, return empty
                    applications = [];
                }
            } catch (error) {
                request.log.error({ error, userId: req.auth.userId }, 'Failed to get recruiter for filtering applications');
                // On error, return empty for recruiters (fail-safe)
                applications = [];
            }
        }
        // Admins and company users see all applications (no filtering)

        return reply.send({ data: applications });
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
