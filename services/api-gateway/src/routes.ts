import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from './clients';
import { AuthContext } from './auth';
import { requireRoles, AuthenticatedRequest, isRecruiter, isCompanyUser, isAdmin } from './rbac';

// Helper to resolve internal user ID and memberships from Clerk ID
async function resolveUserContext(services: ServiceRegistry, auth: AuthContext): Promise<void> {
    const identityService = services.get('identity');
    
    // Sync the Clerk user (idempotent - creates if missing, updates if changed)
    const syncResponse: any = await identityService.post('/sync-clerk-user', {
        clerk_user_id: auth.clerkUserId,
        email: auth.email,
        name: auth.name,
    });
    
    const userId = syncResponse.data.id;
    
    // Get full user profile with memberships
    const profileResponse: any = await identityService.get(`/users/${userId}`);
    
    // Update auth context with user ID and memberships
    auth.userId = userId;
    auth.memberships = profileResponse.data.memberships || [];
}

export function registerRoutes(app: FastifyInstance, services: ServiceRegistry) {
    // Middleware to resolve user context (userId + memberships) for all /api routes
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/api/')) {
            const req = request as AuthenticatedRequest;
            if (req.auth) {
                await resolveUserContext(services, req.auth);
            }
        }
    });

    // Identity service routes
    app.get('/api/me', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const identityService = services.get('identity');
        
        // User context already resolved by middleware
        const profile = await identityService.get(`/users/${req.auth.userId}`);
        return reply.send(profile);
    });

    // ATS service routes - Jobs
    // Anyone authenticated can view jobs (later we'll filter by recruiter assignments)
    app.get('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs?${queryString}` : '/jobs';
        const data = await atsService.get(path);
        return reply.send(data);
    });

    app.get('/api/jobs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/jobs/${id}`);
        return reply.send(data);
    });

    // Only company admins and platform admins can create jobs
    app.post('/api/jobs', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/jobs', request.body);
        return reply.send(data);
    });

    // Only company admins and platform admins can update jobs
    app.patch('/api/jobs/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.patch(`/jobs/${id}`, request.body);
        return reply.send(data);
    });

    // ATS service routes - Applications
    app.get('/api/applications/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/applications/${id}`);
        return reply.send(data);
    });

    // Only recruiters can submit applications
    app.post('/api/applications', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const data = await atsService.post('/applications', {
            ...(request.body as any),
            recruiter_id: req.auth.userId,
        });
        return reply.send(data);
    });

    // Company users and admins can change application stages
    app.patch('/api/applications/:id/stage', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.patch(`/applications/${id}/stage`, request.body);
        return reply.send(data);
    });

    app.get('/api/jobs/:jobId/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/jobs/${jobId}/applications`);
        return reply.send(data);
    });

    // ATS service routes - Placements
    // Recruiters and company users can view placements
    app.get('/api/placements', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.get('/placements');
        return reply.send(data);
    });

    app.get('/api/placements/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/placements/${id}`);
        return reply.send(data);
    });

    // Only company admins and platform admins can create placements
    app.post('/api/placements', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/placements', request.body);
        return reply.send(data);
    });

    // Network service routes - Recruiters
    // Platform admins can view all recruiters
    app.get('/api/recruiters', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.get('/recruiters');
        return reply.send(data);
    });

    // Anyone can view a specific recruiter profile
    app.get('/api/recruiters/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${id}`);
        return reply.send(data);
    });

    // Users can create their own recruiter profile
    app.post('/api/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const data = await networkService.post('/recruiters', {
            ...(request.body as any),
            user_id: req.auth.userId,
        });
        return reply.send(data);
    });

    // Network service routes - Role assignments
    // Recruiters can view their assigned jobs
    app.get('/api/recruiters/:recruiterId/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${recruiterId}/jobs`);
        return reply.send(data);
    });

    // Get recruiters assigned to a specific job
    app.get('/api/jobs/:jobId/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/jobs/${jobId}/recruiters`);
        return reply.send(data);
    });

    // Only platform admins can assign recruiters to roles
    app.post('/api/assignments', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.post('/assignments', request.body);
        return reply.send(data);
    });

    // Only platform admins can unassign recruiters from roles
    app.delete('/api/assignments/:jobId/:recruiterId', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId, recruiterId } = request.params as { jobId: string; recruiterId: string };
        const networkService = services.get('network');
        // Network service expects query params, so we convert path params
        await networkService.delete(`/assignments?job_id=${jobId}&recruiter_id=${recruiterId}`);
        return reply.status(204).send();
    });

    // Billing service routes
    // Anyone authenticated can view plans
    app.get('/api/plans', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.get('/plans');
        return reply.send(data);
    });

    // Recruiters can view their own subscription, admins can view any
    app.get('/api/subscriptions/recruiter/:recruiterId', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { recruiterId } = request.params as { recruiterId: string };
        const billingService = services.get('billing');
        
        // TODO: Add check to ensure user can only view their own subscription unless admin
        const data = await billingService.get(`/subscriptions/recruiter/${recruiterId}`);
        return reply.send(data);
    });

    // Recruiters can create their own subscriptions
    app.post('/api/subscriptions', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.post('/subscriptions', request.body);
        return reply.send(data);
    });

    // Companies - only company admins and platform admins can create companies
    app.post('/api/companies', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/companies', request.body);
        return reply.send(data);
    });

    // Roles - Aggregated view of jobs with recruiter assignments
    // Recruiters see only jobs assigned to them, admins see all jobs
    app.get('/api/roles', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const networkService = services.get('network');

        // Get query parameters for filtering
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs?${queryString}` : '/jobs';

        // Get all jobs
        const jobsResponse: any = await atsService.get(path);
        const jobs = jobsResponse.data || [];

        // If user is a recruiter (not an admin), filter to only assigned jobs
        if (isRecruiter(req.auth) && !isAdmin(req.auth)) {
            // Get recruiter profile for this user
            const recruiterResponse: any = await networkService.get(`/recruiters/by-user/${req.auth.userId}`);
            const recruiter = recruiterResponse.data;

            if (recruiter) {
                // Get jobs assigned to this recruiter
                const assignedJobsResponse: any = await networkService.get(`/recruiters/${recruiter.id}/jobs`);
                const assignedJobIds = assignedJobsResponse.data || [];

                // Filter jobs to only those assigned to this recruiter
                const filteredJobs = jobs.filter((job: any) => assignedJobIds.includes(job.id));
                return reply.send({ data: filteredJobs });
            } else {
                // Recruiter profile not found, return empty list
                return reply.send({ data: [] });
            }
        }

        // Admins and company users see all jobs
        return reply.send({ data: jobs });
    });
}
