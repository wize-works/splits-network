import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from './clients';
import { AuthContext } from './auth';

interface AuthenticatedRequest extends FastifyRequest {
    auth: AuthContext;
}

// Helper to resolve internal user ID from Clerk ID
async function resolveUserId(services: ServiceRegistry, auth: AuthContext): Promise<string> {
    const identityService = services.get('identity');
    
    // Sync the Clerk user (idempotent - creates if missing, updates if changed)
    const syncResponse: any = await identityService.post('/sync-clerk-user', {
        clerk_user_id: auth.clerkUserId,
        email: auth.email,
        name: auth.name,
    });
    
    return syncResponse.data.id;
}

export function registerRoutes(app: FastifyInstance, services: ServiceRegistry) {
    // Identity service routes
    app.get('/api/me', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const identityService = services.get('identity');
        
        // Resolve internal user ID
        const userId = await resolveUserId(services, req.auth);
        
        // Get the full profile
        const profile = await identityService.get(`/users/${userId}`);
        return reply.send(profile);
    });

    // ATS service routes - Jobs
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

    app.post('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/jobs', request.body);
        return reply.send(data);
    });

    app.patch('/api/jobs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
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

    app.post('/api/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = await resolveUserId(services, req.auth);
        const atsService = services.get('ats');
        const data = await atsService.post('/applications', {
            ...(request.body as any),
            recruiter_id: userId,
        });
        return reply.send(data);
    });

    app.patch(
        '/api/applications/:id/stage',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            const atsService = services.get('ats');
            const data = await atsService.patch(`/applications/${id}/stage`, request.body);
            return reply.send(data);
        }
    );

    app.get('/api/jobs/:jobId/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/jobs/${jobId}/applications`);
        return reply.send(data);
    });

    // ATS service routes - Placements
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

    app.post('/api/placements', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = await resolveUserId(services, req.auth);
        const atsService = services.get('ats');
        const data = await atsService.post('/placements', {
            ...(request.body as any),
            recruiter_id: userId,
        });
        return reply.send(data);
    });

    // Network service routes - Recruiters
    app.get('/api/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.get('/recruiters');
        return reply.send(data);
    });

    app.get('/api/recruiters/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${id}`);
        return reply.send(data);
    });

    app.post('/api/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.post('/recruiters', request.body);
        return reply.send(data);
    });

    // Network service routes - Role assignments
    app.get(
        '/api/recruiters/:recruiterId/jobs',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { recruiterId } = request.params as { recruiterId: string };
            const networkService = services.get('network');
            const data = await networkService.get(`/recruiters/${recruiterId}/jobs`);
            return reply.send(data);
        }
    );

    app.post('/api/assignments', async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.post('/assignments', request.body);
        return reply.send(data);
    });

    // Billing service routes
    app.get('/api/plans', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.get('/plans');
        return reply.send(data);
    });

    app.get(
        '/api/subscriptions/recruiter/:recruiterId',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { recruiterId } = request.params as { recruiterId: string };
            const billingService = services.get('billing');
            const data = await billingService.get(`/subscriptions/recruiter/${recruiterId}`);
            return reply.send(data);
        }
    );

    app.post('/api/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.post('/subscriptions', request.body);
        return reply.send(data);
    });

    // Companies
    app.post('/api/companies', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/companies', request.body);
        return reply.send(data);
    });
}
