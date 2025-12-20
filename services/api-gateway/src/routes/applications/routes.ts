import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Applications Routes
 * - Application lifecycle management
 * - Stage transitions
 */
export function registerApplicationsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // List applications
    app.get('/api/applications', {
        schema: {
            description: 'List all applications',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/applications?${queryString}` : '/applications';
        const data = await atsService().get(path);
        return reply.send(data);
    });

    // Get application by ID
    app.get('/api/applications/:id', {
        schema: {
            description: 'Get application by ID',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().get(`/applications/${id}`);
        return reply.send(data);
    });

    // Submit application (recruiters only)
    app.post('/api/applications', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Submit new application',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);

        // Get actual recruiter ID from network service using user ID
        let recruiterId: string | undefined;
        try {
            const recruiterResponse: any = await networkService.get(
                `/recruiters/by-user/${req.auth.userId}`,
                undefined,
                correlationId
            );
            recruiterId = recruiterResponse.data?.id;
        } catch (error) {
            request.log.error({ error, userId: req.auth.userId }, 'Failed to get recruiter ID');
            return reply.status(403).send({ error: 'Active recruiter status required' });
        }

        if (!recruiterId) {
            return reply.status(403).send({ error: 'Active recruiter status required' });
        }

        const data = await atsService().post('/applications', {
            ...(request.body as any),
            recruiter_id: recruiterId,
        }, correlationId);
        return reply.send(data);
    });

    // Accept application (company users only)
    app.post('/api/applications/:id/accept', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
        schema: {
            description: 'Accept application',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().post(`/applications/${id}/accept`, request.body, correlationId);
        return reply.send(data);
    });

    // Change application stage (recruiters, company users and admins)
    app.patch('/api/applications/:id/stage', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin']),
        schema: {
            description: 'Change application stage',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().patch(`/applications/${id}/stage`, request.body);
        return reply.send(data);
    });

    // Submit candidate application (candidate self-service)
    app.post('/api/applications/submit', {
        preHandler: requireRoles(['candidate']),
        schema: {
            description: 'Submit candidate application',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        const atsService = services.get('ats');
        
        request.log.info({ 
            userId: req.auth.userId,
            body: request.body 
        }, 'Candidate submitting application');

        // Get candidate ID from email - candidates are external users
        const candidatesResponse: any = await atsService.get(
            `/candidates?email=${encodeURIComponent(req.auth.email)}`,
            undefined,
            correlationId
        );
        const candidates = candidatesResponse.data || [];
        
        if (candidates.length === 0) {
            return reply.status(404).send({ error: 'Candidate profile not found' });
        }

        const candidateId = candidates[0].id;

        // Forward to ATS service with candidate_id in request
        const data = await atsService.post('/applications/submit', {
            ...(request.body as any),
            candidate_id: candidateId,
        }, correlationId);
        return reply.status(201).send(data);
    });

    // Withdraw application (candidates only)
    app.post('/api/applications/:id/withdraw', {
        preHandler: requireRoles(['candidate']),
        schema: {
            description: 'Withdraw application',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().post(`/applications/${id}/withdraw`, request.body, correlationId);
        return reply.send(data);
    });

    // Get full application details with documents and pre-screen answers
    app.get('/api/applications/:id/full', {
        schema: {
            description: 'Get full application details',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().get(`/applications/${id}/full`);
        return reply.send(data);
    });

    // Get pending applications for recruiter
    app.get('/api/recruiters/:recruiterId/pending-applications', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Get pending applications for recruiter',
            tags: ['applications', 'recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const data = await atsService().get(`/recruiters/${recruiterId}/pending-applications`);
        return reply.send(data);
    });

    // Recruiter submits application to company
    app.post('/api/applications/:id/recruiter-submit', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Recruiter submits application to company',
            tags: ['applications', 'recruiters'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().post(`/applications/${id}/recruiter-submit`, request.body, correlationId);
        return reply.send(data);
    });

    // Company requests pre-screen for direct application
    app.post('/api/applications/:id/request-prescreen', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
        schema: {
            description: 'Request recruiter pre-screen for direct application',
            tags: ['applications', 'company'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        
        // Add user context to request body
        const requestBody = {
            ...(request.body as any),
            requested_by_user_id: req.auth.userId,
        };

        const data = await atsService().post(`/applications/${id}/request-prescreen`, requestBody, correlationId);
        return reply.send(data);
    });
}

