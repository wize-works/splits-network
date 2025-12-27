import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest, isPlatformAdmin, isCompanyAdmin, isHiringManager, isRecruiter } from '../../rbac';
import { registerMeRecruitersRoute } from './me-recruiters';

/**
 * Determine the primary user role for header passing to backend services
 * Uses the role that was matched by requireRoles() middleware
 * This is for logging/audit purposes - authorization already enforced by requireRoles()
 * 
 * Maps portal role names to ATS service role names:
 * - platform_admin -> admin
 * - recruiter -> recruiter
 * - company_admin -> company_admin
 * - hiring_manager -> hiring_manager
 */
function determineUserRole(req: AuthenticatedRequest): string {
    // Use the role that granted access via requireRoles() if available
    if (req.matchedRole) {
        // Map platform_admin to admin for ATS service compatibility
        if (req.matchedRole === 'platform_admin') {
            return 'admin';
        }
        return req.matchedRole;
    }
    
    // Fallback: check memberships
    const memberships = req.auth.memberships || [];
    
    if (isPlatformAdmin(req.auth)) {
        return 'admin';
    }
    
    if (isCompanyAdmin(req.auth)) {
        return 'company_admin';
    }
    
    if (isHiringManager(req.auth)) {
        return 'hiring_manager';
    }
    
    // Fallback to candidate if no other role matches
    return 'candidate';
}

/**
 * Candidates Routes (API Gateway)
 * 
 * Simple proxy to ATS Service - all business logic moved to backend
 */
export function registerCandidatesRoutes(app: FastifyInstance, services: ServiceRegistry) {
    // Register sub-routes
    registerMeRecruitersRoute(app, services);
    const atsService = () => services.get('ats');
    const networkService = () => services.get('network');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // List candidates
    app.get('/api/candidates', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'], services),
        schema: {
            description: 'List all candidates',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        const userRole = determineUserRole(req);
        
        const queryParams = new URLSearchParams(request.query as any);
        const path = queryParams.toString() ? `/candidates?${queryParams.toString()}` : '/candidates';
        
        const data = await atsService().get(path, undefined, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        });
        return reply.send(data);
    });

    // Get candidate by ID
    app.get('/api/candidates/:id', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'], services),
        schema: {
            description: 'Get candidate by ID',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().get(`/candidates/${id}`);
        return reply.send(data);
    });
    // Update my own candidate profile (self-service for candidates)
    app.patch('/api/candidates/me', {
        schema: {
            description: 'Update my own candidate profile',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        
        if (!req.auth || !req.auth.clerkUserId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        
        const data = await atsService().patch('/candidates/me', request.body, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
        });
        return reply.send(data);
    });
    // Create a new candidate (recruiters and platform admins only)
    app.post('/api/candidates', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Create a new candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        const userRole = determineUserRole(req);
        
        const data = await atsService().post('/candidates', request.body, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        });
        return reply.send(data);
    });

    // Update a candidate (recruiters with active relationship or platform admins)
    app.patch('/api/candidates/:id', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
        schema: {
            description: 'Update a candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const userRole = determineUserRole(req);
        
        const data = await atsService().patch(`/candidates/${id}`, request.body, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        });
        return reply.send(data);
    });

    // Get candidate applications
    app.get('/api/candidates/:id/applications', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'], services),
        schema: {
            description: 'Get applications for a candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await atsService().get(`/candidates/${id}/applications`);
        return reply.send(data);
    });

    // List candidate sourcers (platform admins only)
    app.get('/api/candidates/sourcers', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'List candidate sourcers',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/candidates/sourcers?${queryString}` : '/candidates/sourcers';
        const data = await atsService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Candidate Ownership
    // ==========================================

    // Source candidate (recruiters only)
    app.post('/api/candidates/:id/source', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Source a candidate (mark as sourced by recruiter)',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        const userRole = determineUserRole(req);

        const data = await atsService().post(`/candidates/${id}/source`, request.body, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        });
        return reply.send(data);
    });

    // Get candidate sourcer info
    app.get('/api/candidates/:id/sourcer', {
        schema: {
            description: 'Get candidate sourcer information',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().get(`/candidates/${id}/sourcer`, undefined, correlationId);
        return reply.send(data);
    });

    // Record outreach (recruiters only)
    app.post('/api/candidates/:id/outreach', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Record recruiter outreach to candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        const userRole = determineUserRole(req);

        const data = await atsService().post(`/candidates/${id}/outreach`, request.body, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        });
        return reply.send(data);
    });

    // Check candidate protection status
    app.get('/api/candidates/:id/protection-status', {
        schema: {
            description: 'Check candidate protection status',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().get(`/candidates/${id}/protection-status`, undefined, correlationId);
        return reply.send(data);
    });

    // Get my applications (candidate self-service)
    app.get('/api/candidates/me/applications', {
        schema: {
            description: 'Get my applications',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        
        if (!req.auth || !req.auth.clerkUserId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        
        const data = await atsService().get('/candidates/me/applications', undefined, correlationId, {
            'x-clerk-user-id': req.auth.clerkUserId,
        });
        return reply.send(data);
    });
}
