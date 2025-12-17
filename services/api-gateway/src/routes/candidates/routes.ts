import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Candidates Routes
 * - Candidate CRUD operations
 * - Candidate ownership (Phase 2)
 */
export function registerCandidatesRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const networkService = () => services.get('network');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // List candidates
    app.get('/api/candidates', {
        schema: {
            description: 'List all candidates',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);
        
        // Check if user is a recruiter (check memberships array)
        const isRecruiter = req.auth?.memberships?.some(m => m.role === 'recruiter');
        
        // If recruiter, show candidates they SOURCED OR have active relationships with
        if (isRecruiter) {
            // Get recruiter ID for this user
            try {
                const recruiterResponse: any = await networkService().get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );
                
                if (!recruiterResponse.data) {
                    // Recruiter profile doesn't exist yet - return empty list
                    return reply.send({ data: [] });
                }
                
                const recruiterId = recruiterResponse.data.id;
                
                // Get candidates SOURCED by this recruiter (permanent visibility)
                const queryParams = new URLSearchParams(request.query as any);
                queryParams.set('recruiter_id', recruiterId);
                const sourcedCandidatesResponse: any = await atsService().get(`/candidates?${queryParams.toString()}`);
                const sourcedCandidates = sourcedCandidatesResponse.data || [];
                
                // Get candidates with active relationships
                const relationshipsResponse: any = await networkService().get(
                    `/recruiter-candidates/recruiter/${recruiterId}`,
                    undefined,
                    correlationId
                );
                
                const relationships = relationshipsResponse.data || [];
                const relationshipCandidateIds = relationships
                    .filter((rel: any) => rel.status === 'active')
                    .map((rel: any) => rel.candidate_id);
                
                // Fetch relationship candidates that aren't already sourced
                const sourcedCandidateIds = new Set(sourcedCandidates.map((c: any) => c.id));
                const relationshipCandidatesToFetch = relationshipCandidateIds.filter(
                    (id: string) => !sourcedCandidateIds.has(id)
                );
                
                let relationshipCandidates: any[] = [];
                if (relationshipCandidatesToFetch.length > 0) {
                    // Fetch these candidates individually (or implement bulk fetch in ATS service)
                    relationshipCandidates = await Promise.all(
                        relationshipCandidatesToFetch.map(async (id: string) => {
                            try {
                                const response: any = await atsService().get(`/candidates/${id}`);
                                return response.data;
                            } catch (err) {
                                console.error(`Failed to fetch candidate ${id}:`, err);
                                return null;
                            }
                        })
                    );
                    relationshipCandidates = relationshipCandidates.filter(c => c !== null);
                }
                
                // Combine and deduplicate
                const allCandidates = [...sourcedCandidates, ...relationshipCandidates];
                
                return reply.send({ data: allCandidates });
            } catch (err: any) {
                // If recruiter profile not found (404), return empty list
                if (err.message && err.message.includes('404')) {
                    return reply.send({ data: [] });
                }
                // Re-throw other errors
                throw err;
            }
        }
        
        // Platform admins see all candidates
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/candidates?${queryString}` : '/candidates';
        const data = await atsService().get(path);
        return reply.send(data);
    });

    // Get candidate by ID
    app.get('/api/candidates/:id', {
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
        
        // Check if user is a recruiter
        const isRecruiter = req.auth?.memberships?.some(m => m.role === 'recruiter');
        
        // If recruiter, create the candidate and establish relationship
        if (isRecruiter) {
            // Get recruiter ID
            try {
                const recruiterResponse: any = await networkService().get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );
                
                if (!recruiterResponse.data) {
                    return reply.status(403).send({ 
                        error: 'Recruiter profile not found. Please contact an administrator to set up your recruiter profile.' 
                    });
                }
                
                const recruiterId = recruiterResponse.data.id;
                
                // Add recruiter_id to body for ATS service
                const bodyWithRecruiter = {
                    ...request.body,
                    recruiter_id: recruiterId
                };
                
                const candidateData = await atsService().post('/candidates', bodyWithRecruiter);
                
                // Create recruiter-candidate relationship in network service
                if (candidateData.data?.id) {
                    await networkService().post('/recruiter-candidates', {
                        recruiter_id: recruiterId,
                        candidate_id: candidateData.data.id
                    }, undefined, correlationId);
                }
                
                return reply.send(candidateData);
            } catch (err: any) {
                // If recruiter profile not found (404), return helpful error
                if (err.message && err.message.includes('404')) {
                    return reply.status(403).send({ 
                        error: 'Recruiter profile not found. Please contact an administrator to set up your recruiter profile.' 
                    });
                }
                // Re-throw other errors
                throw err;
            }
        }
        
        // Platform admins don't create recruiter relationships
        const data = await atsService().post('/candidates', request.body);
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
        
        // Get candidate to check if self-managed
        const candidateResponse: any = await atsService().get(`/candidates/${id}`);
        if (!candidateResponse.data) {
            return reply.status(404).send({ error: 'Candidate not found' });
        }
        
        const candidate = candidateResponse.data;
        
        // Cannot update self-managed candidates
        if (candidate.user_id) {
            return reply.status(403).send({ 
                error: 'Cannot update self-managed candidate profile' 
            });
        }
        
        // Check if user is a recruiter
        const isRecruiter = req.auth?.memberships?.some(m => m.role === 'recruiter');
        
        // If recruiter, verify they have an ACTIVE relationship with this candidate
        // Note: Sourcing provides visibility only, NOT editing rights
        if (isRecruiter) {
            try {
                const recruiterResponse: any = await networkService().get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );
                
                if (!recruiterResponse.data) {
                    return reply.status(403).send({ 
                        error: 'Recruiter profile not found. Please contact an administrator to set up your recruiter profile.' 
                    });
                }
                
                const recruiterId = recruiterResponse.data.id;
                
                // Check for active relationship (required for editing)
                const relationshipResponse: any = await networkService().get(
                    `/recruiter-candidates/${recruiterId}/${id}`,
                    undefined,
                    correlationId
                );
                
                // Must have active relationship to edit
                if (!relationshipResponse.data || relationshipResponse.data.status !== 'active') {
                    return reply.status(403).send({ 
                        error: 'You do not have permission to update this candidate. An active recruiter-candidate relationship is required.' 
                    });
                }
            } catch (err: any) {
                // If recruiter profile not found (404), return helpful error
                if (err.message && err.message.includes('404') && err.message.includes('Recruiter for user')) {
                    return reply.status(403).send({ 
                        error: 'Recruiter profile not found. Please contact an administrator to set up your recruiter profile.' 
                    });
                }
                // Re-throw other errors
                throw err;
            }
        }
        
        // Update candidate
        const data = await atsService().patch(`/candidates/${id}`, request.body);
        return reply.send(data);
    });

    // Get candidate applications
    app.get('/api/candidates/:id/applications', {
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

        // Get recruiter ID for this user
        const recruiterResponse: any = await networkService().get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        const data = await atsService().post(`/candidates/${id}/source`, {
            ...(request.body as any),
            recruiter_id: recruiterResponse.data.id,
        }, correlationId);
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

        // Get recruiter ID for this user
        const recruiterResponse: any = await networkService().get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        const data = await atsService().post(`/candidates/${id}/outreach`, {
            ...(request.body as any),
            recruiter_id: recruiterResponse.data.id,
        }, correlationId);
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
}
