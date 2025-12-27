import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from '../../service';
import { CandidatesService } from '../../services/candidates/candidates-service';

function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id'] as string;
    const userRole = (request.headers['x-user-role'] as string) || 'candidate';
    if (!clerkUserId) {
        throw new Error('Missing x-clerk-user-id header');
    }
    return { clerkUserId, userRole: userRole as 'candidate' | 'recruiter' | 'company' | 'admin' };
}

function getCorrelationId(request: FastifyRequest): string {
    return (request as any).correlationId || `req-${Date.now()}`;
}

export function registerCandidateRoutes(app: FastifyInstance, service: AtsService, candidatesService: CandidatesService) {
    // Get my own candidate profile (candidates only)
    // Uses Clerk user ID from headers to look up candidate profile
    app.get(
        '/candidates/me',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { clerkUserId } = getUserContext(request);
            const correlationId = getCorrelationId(request);
            
            try {
                // Look up candidate by clerk_user_id
                const candidate = await candidatesService.getCandidateByClerkUserId(clerkUserId, correlationId);
                
                if (!candidate) {
                    return reply.status(404).send({ 
                        error: { 
                            code: 'CANDIDATE_NOT_FOUND', 
                            message: 'No candidate profile found for this user' 
                        } 
                    });
                }
                
                return reply.send({ data: candidate });
            } catch (error: any) {
                throw error;
            }
        }
    );

    // Get all candidates with optional filters
    // Now accepts Clerk user ID from headers and performs entity resolution internally
    // Supports scope parameter: mine (default) = sourced + relationships, all = entire talent pool
    app.get(
        '/candidates',
        async (request: FastifyRequest<{ Querystring: { search?: string; limit?: string; offset?: string; email?: string; scope?: 'mine' | 'all' } }>, reply: FastifyReply) => {
            const { search, limit, offset, email, scope } = request.query;
            const { clerkUserId, userRole } = getUserContext(request);
            const correlationId = getCorrelationId(request);
            
            try {
                const candidates = await candidatesService.getCandidates({
                    clerkUserId,
                    userRole,
                    search,
                    email,
                    limit: limit ? parseInt(limit) : undefined,
                    offset: offset ? parseInt(offset) : undefined,
                    scope,
                }, correlationId);
                return reply.send({ data: candidates });
            } catch (error: any) {
                // Gateway handles authorization - all errors here are unexpected
                throw error;
            }
        }
    );

    // Get candidate by ID
    app.get(
        '/candidates/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const candidate = await service.getCandidateById(request.params.id);
            return reply.send({ data: candidate });
        }
    );

    // Get applications for a candidate
    app.get(
        '/candidates/:id/applications',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const applications = await service.getApplicationsByCandidateId(request.params.id);
            return reply.send({ data: applications });
        }
    );

    // Create a new candidate
    // Now accepts Clerk user ID from headers for recruiters
    app.post(
        '/candidates',
        async (request: FastifyRequest<{ Body: { email: string; full_name: string; linkedin_url?: string } }>, reply: FastifyReply) => {
            const { email, full_name, linkedin_url } = request.body;
            const { clerkUserId, userRole } = getUserContext(request);
            const correlationId = getCorrelationId(request);
            
            try {
                const candidate = await candidatesService.createCandidate({
                    clerkUserId,
                    userRole: userRole as 'recruiter' | 'admin',
                    email,
                    full_name,
                    linkedin_url,
                }, correlationId);
                return reply.status(201).send({ data: candidate });
            } catch (error: any) {
                if (error.message.includes('required fields')) {
                    return reply.status(400).send({ 
                        error: { code: 'VALIDATION_ERROR', message: error.message } 
                    });
                }
                if (error.message.includes('Recruiter profile')) {
                    return reply.status(403).send({ 
                        error: { code: 'INACTIVE_RECRUITER', message: error.message } 
                    });
                }
                throw error;
            }
        }
    );

    // Update a candidate
    // Now accepts Clerk user ID from headers and checks permissions
    app.patch(
        '/candidates/:id',
        async (request: FastifyRequest<{ 
            Params: { id: string }; 
            Querystring: { allow_self_managed?: string };
            Body: { 
                full_name?: string; 
                email?: string; 
                linkedin_url?: string;
                github_url?: string;
                portfolio_url?: string;
                phone?: string;
                location?: string;
                current_title?: string;
                current_company?: string;
                bio?: string;
                skills?: string;
            } 
        }>, reply: FastifyReply) => {
            const { id } = request.params;
            const updates = request.body;
            const allowSelfManaged = (request.query as any).allow_self_managed === 'true';
            const { clerkUserId, userRole } = getUserContext(request);
            const correlationId = getCorrelationId(request);
            
            try {
                const candidate = await candidatesService.updateCandidate({
                    clerkUserId,
                    userRole: userRole as 'recruiter' | 'admin',
                    candidateId: id,
                    updates,
                    allowSelfManaged,
                }, correlationId);
                return reply.send({ data: candidate });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.status(404).send({ 
                        error: { code: 'NOT_FOUND', message: error.message } 
                    });
                }
                if (error.message.includes('self-managed') || error.message.includes('permission')) {
                    return reply.status(403).send({ 
                        error: { code: 'FORBIDDEN', message: error.message } 
                    });
                }
                if (error.message.includes('Recruiter profile')) {
                    return reply.status(403).send({ 
                        error: { code: 'INACTIVE_RECRUITER', message: error.message } 
                    });
                }
                throw error;
            }
        }
    );

    // Get my applications (candidate self-service)
    app.get('/candidates/me/applications', {
        schema: {
            description: 'Get my applications (self-service)',
            tags: ['candidates'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const clerkUserId = request.headers['x-clerk-user-id'] as string;
        const correlationId = getCorrelationId(request);
        
        if (!clerkUserId) {
            return reply.status(401).send({ 
                error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } 
            });
        }
        
        try {
            const applications = await candidatesService.getSelfApplications(clerkUserId, correlationId);
            return reply.send({ data: applications });
        } catch (error: any) {
            throw error;
        }
    });

    // Link candidate to user (internal endpoint called by network service)
    app.post(
        '/candidates/:id/link-user',
        async (request: FastifyRequest<{ 
            Params: { id: string }; 
            Body: { user_id: string } 
        }>, reply: FastifyReply) => {
            const { id } = request.params;
            const { user_id } = request.body;
            
            if (!user_id) {
                return reply.status(400).send({ 
                    error: 'Missing required fields',
                    message: 'user_id is required' 
                });
            }
            
            const candidate = await service.linkCandidateToUser(id, user_id);
            return reply.send({ data: candidate });
        }
    );

    // Self-service candidate update
    app.patch(
        '/candidates/me',
        async (request: FastifyRequest<{ Body: Record<string, any> }>, reply: FastifyReply) => {
            const clerkUserId = request.headers['x-clerk-user-id'] as string;
            const correlationId = getCorrelationId(request);
            
            if (!clerkUserId) {
                return reply.status(401).send({ 
                    error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } 
                });
            }
            
            try {
                const candidate = await candidatesService.selfUpdateCandidate({
                    userId: clerkUserId, // Clerk user ID
                    updates: request.body,
                }, correlationId);
                return reply.send({ data: candidate });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    return reply.status(404).send({ 
                        error: { code: 'NOT_FOUND', message: error.message } 
                    });
                }
                if (error.message.includes('not self-managed')) {
                    return reply.status(403).send({ 
                        error: { code: 'FORBIDDEN', message: error.message } 
                    });
                }
                throw error;
            }
        }
    );
}
