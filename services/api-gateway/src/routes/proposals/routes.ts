import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Unified Proposals Routes (Phase 1A) - API Gateway
 * 
 * Passes raw Clerk user ID and role to ATS Service.
 * NO business logic here - ATS Service handles entity resolution internally.
 * 
 * @see docs/guidance/unified-proposals-system.md
 */

export function registerProposalsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const networkService = () => services.get('network');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    /**
     * Determine user's primary role from Clerk memberships AND network service
     * 
     * Important: Recruiters are NOT in memberships - they're stored in network.recruiters table
     * We must check network service for recruiter status
     */
    async function determineUserRole(auth: any, correlationId?: string): Promise<'candidate' | 'recruiter' | 'company' | 'admin'> {
        const memberships = auth.memberships || [];
        
        if (memberships.some((m: any) => m.role === 'platform_admin')) {
            return 'admin';
        }
        if (memberships.some((m: any) => m.role === 'company_admin')) {
            return 'company';
        }
        
        // Check if user is a recruiter by querying network service
        try {
            const recruiterResponse: any = await networkService().get(
                `/recruiters/by-user/${auth.userId}`,
                undefined,
                correlationId
            );
            
            if (recruiterResponse?.data) {
                return 'recruiter';
            }
        } catch (error) {
            // Not a recruiter - continue to candidate fallback
        }
        
        return 'candidate';
    }

    /**
     * GET /api/proposals
     * Get all proposals for current user (role-filtered)
     */
    app.get('/api/proposals', {
        schema: {
            description: 'Get all proposals for current user',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        // Determine user role (no entity resolution in gateway)
        const userRole = await determineUserRole(req.auth, correlationId);

        // Forward query params directly to ATS service
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = `/api/proposals?${queryString}`;

        // Pass Clerk user ID (NOT internal userId) to ATS service
        const headers = {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        };

        const data = await atsService().get(path, undefined, correlationId, headers);
        return reply.send(data);
    });

    /**
     * GET /api/proposals/actionable
     * Get proposals requiring user's action
     */
    app.get('/api/proposals/actionable', {
        schema: {
            description: 'Get proposals requiring your action',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        const userRole = await determineUserRole(req.auth, correlationId);
        
        const headers = {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        };
        
        const data = await atsService().get('/api/proposals/actionable', undefined, correlationId, headers);
        return reply.send(data);
    });

    /**
     * GET /api/proposals/pending
     * Get proposals awaiting response from others
     */
    app.get('/api/proposals/pending', {
        schema: {
            description: 'Get proposals awaiting response from others',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        const userRole = await determineUserRole(req.auth, correlationId);
        
        const headers = {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        };
        
        const data = await atsService().get('/api/proposals/pending', undefined, correlationId, headers);
        return reply.send(data);
    });

    /**
     * GET /api/proposals/summary
     * Get summary statistics
     */
    app.get('/api/proposals/summary', {
        schema: {
            description: 'Get proposal summary statistics',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        const userRole = await determineUserRole(req.auth, correlationId);
        
        const headers = {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        };
        
        const data = await atsService().get('/api/proposals/summary', undefined, correlationId, headers);
        return reply.send(data);
    });

    /**
     * GET /api/proposals/:id
     * Get single proposal details
     */
    app.get('/api/proposals/:id', {
        schema: {
            description: 'Get proposal by ID',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);

        const userRole = await determineUserRole(req.auth, correlationId);
        
        const headers = {
            'x-clerk-user-id': req.auth.clerkUserId,
            'x-user-role': userRole,
        };
        
        const data = await atsService().get(`/api/proposals/${id}`, undefined, correlationId, headers);
        return reply.send(data);
    });

    /**
     * POST /api/proposals/:id/accept
     * Accept a proposal (candidate accepts job opportunity, company accepts application)
     */
    app.post('/api/proposals/:id/accept', {
        schema: {
            description: 'Accept a proposal',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);

        // Map to appropriate ATS endpoint based on stage
        // For recruiter_proposed → candidate accepting job opportunity
        // For submitted → company accepting application
        const data = await atsService().post(`/applications/${id}/accept`, request.body, correlationId);
        return reply.send(data);
    });

    /**
     * POST /api/proposals/:id/decline
     * Decline a proposal
     */
    app.post('/api/proposals/:id/decline', {
        schema: {
            description: 'Decline a proposal',
            tags: ['proposals'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);

        // Map to appropriate ATS endpoint
        const data = await atsService().post(`/applications/${id}/decline`, request.body, correlationId);
        return reply.send(data);
    });
}
