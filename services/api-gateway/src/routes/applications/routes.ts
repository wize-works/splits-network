import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest, isRecruiter } from '../../rbac';

/**
 * Applications Routes (API Gateway)
 * 
 * Passes raw Clerk user ID to ATS Service.
 * NO business logic here - ATS Service handles entity resolution internally.
 */
export function registerApplicationsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    /**
     * Determine user's primary role from Clerk memberships
     */
    function determineUserRole(auth: any): 'candidate' | 'recruiter' | 'company' | 'admin' {
        const memberships = auth.memberships || [];
        
        if (memberships.some((m: any) => m.role === 'platform_admin')) {
            return 'admin';
        }
        if (memberships.some((m: any) => m.role === 'company_admin')) {
            return 'company';
        }
        if (memberships.some((m: any) => m.role === 'recruiter')) {
            return 'recruiter';
        }
        return 'candidate';
    }

    // List applications with server-side pagination and filtering
    app.get('/api/applications/paginated', {
        schema: {
            description: 'List applications with pagination, search, and filters',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        
        // Determine user role
        const userRole = determineUserRole(req.auth);
        
        // Build query params - pass query filters as-is
        const queryParams = new URLSearchParams(request.query as any);
        const queryString = queryParams.toString();
        const path = `/applications/paginated?${queryString}`;
        
        // Pass raw Clerk user ID and role to ATS service for internal resolution
        const headers = {
            'x-clerk-user-id': req.auth.userId,
            'x-user-role': userRole,
        };
        
        const data = await atsService().get(path, undefined, correlationId, headers);
        return reply.send(data);
    });

    // List applications (legacy endpoint)
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
        const correlationId = getCorrelationId(request);

        // Simple proxy - pass user context to backend
        const userRole = determineUserRole(req.auth);
        const data = await atsService().post('/applications', request.body, correlationId, {
            'x-clerk-user-id': req.auth.userId,
            'x-user-role': userRole,
        });
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

    // Add note to application (recruiters only)
    app.patch('/api/applications/:id/notes', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Add note to application',
            tags: ['applications'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().patch(`/applications/${id}/notes`, request.body);
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
        
        request.log.info({ 
            userId: req.auth.userId,
            body: request.body 
        }, 'Candidate submitting application');

        // Pass user ID to backend for candidate lookup
        const data = await atsService().post('/applications/submit', request.body, correlationId, {
            'x-clerk-user-id': req.auth.userId,
        });
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
        const req = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);

        // Pass user ID to backend for candidate lookup and permission checking
        const data = await atsService().post(`/applications/${id}/withdraw`, request.body, correlationId, {
            'x-clerk-user-id': req.auth.userId,
        });
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

    // Get AI review for application
    app.get('/api/applications/:id/ai-review', {
        schema: {
            description: 'Get AI review for application',
            tags: ['applications', 'ai-review'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().get(`/applications/${id}/ai-review`, undefined, correlationId);
        return reply.send(data);
    });

    // Trigger AI review for application (POST)
    app.post('/api/applications/:id/ai-review', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager']),
        schema: {
            description: 'Trigger AI review for application',
            tags: ['applications', 'ai-review'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().post(`/applications/${id}/ai-review`, request.body, correlationId);
        return reply.send(data);
    });
}

