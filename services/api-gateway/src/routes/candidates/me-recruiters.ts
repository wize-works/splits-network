import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest } from '../../rbac';

/**
 * Get My Recruiters Endpoint
 * Returns all recruiter relationships for the authenticated candidate
 */
export function registerMeRecruitersRoute(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const networkService = () => services.get('network');
    const identityService = () => services.get('identity');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    app.get('/api/candidates/me/recruiters', {
        preHandler: requireRoles(['candidate'], services),
        schema: {
            description: 'Get all recruiter relationships for authenticated candidate',
            tags: ['candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        try {
            // Get candidate profile for current user using email
            const candidateResponse: any = await atsService().get(
                `/candidates?email=${encodeURIComponent(req.auth.email)}`,
                undefined,
                correlationId,
                { 'x-clerk-user-id': req.auth.clerkUserId } // Forward user ID to ATS service
            );

            const candidates = candidateResponse.data || [];
            
            if (candidates.length === 0) {
                return reply.status(404).send({
                    error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' }
                });
            }

            const candidateId = candidates[0].id;

            // Get all recruiter relationships for this candidate
            const relationshipsResponse: any = await networkService().get(
                `/recruiter-candidates/candidate/${candidateId}`,
                undefined,
                correlationId
            );

            const relationships = relationshipsResponse.data || [];

            // Enrich each relationship with recruiter details
            const enrichedRelationships = await Promise.all(
                relationships.map(async (rel: any) => {
                    try {
                        // Get recruiter profile
                        const recruiterResponse: any = await networkService().get(
                            `/recruiters/${rel.recruiter_id}`,
                            undefined,
                            correlationId
                        );

                        const recruiter = recruiterResponse.data;

                        // Get user details for recruiter
                        let recruiterUser: any = null;
                        if (recruiter?.user_id) {
                            try {
                                const userResponse: any = await identityService().get(
                                    `/users/${recruiter.user_id}`,
                                    undefined,
                                    correlationId
                                );
                                recruiterUser = userResponse.data;
                            } catch (err) {
                                console.warn(`Failed to fetch user details for recruiter ${recruiter.user_id}:`, err);
                            }
                        }

                        // Calculate days until expiry for active relationships
                        let daysUntilExpiry: number | undefined;
                        if (rel.status === 'active' && rel.relationship_end_date) {
                            const endDate = new Date(rel.relationship_end_date);
                            const now = new Date();
                            const diffTime = endDate.getTime() - now.getTime();
                            daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }

                        return {
                            id: rel.id,
                            recruiter_id: rel.recruiter_id,
                            recruiter_name: recruiterUser?.name || 'Unknown Recruiter',
                            recruiter_email: recruiterUser?.email || '',
                            recruiter_bio: recruiter?.bio,
                            recruiter_status: recruiter?.status || 'unknown',
                            relationship_start_date: rel.relationship_start_date,
                            relationship_end_date: rel.relationship_end_date,
                            status: rel.status,
                            consent_given: rel.consent_given,
                            consent_given_at: rel.consent_given_at,
                            created_at: rel.created_at,
                            days_until_expiry: daysUntilExpiry,
                        };
                    } catch (err) {
                        console.error(`Failed to enrich relationship ${rel.id}:`, err);
                        // Return minimal relationship data
                        return {
                            id: rel.id,
                            recruiter_id: rel.recruiter_id,
                            recruiter_name: 'Unknown Recruiter',
                            recruiter_email: '',
                            relationship_start_date: rel.relationship_start_date,
                            relationship_end_date: rel.relationship_end_date,
                            status: rel.status,
                            consent_given: rel.consent_given,
                            consent_given_at: rel.consent_given_at,
                            created_at: rel.created_at,
                        };
                    }
                })
            );

            // Group by status
            const active = enrichedRelationships
                .filter(rel => rel.status === 'active')
                .sort((a, b) => {
                    // Sort active by days until expiry (soonest first)
                    if (a.days_until_expiry !== undefined && b.days_until_expiry !== undefined) {
                        return a.days_until_expiry - b.days_until_expiry;
                    }
                    return 0;
                });

            const expired = enrichedRelationships
                .filter(rel => rel.status === 'expired')
                .sort((a, b) => new Date(b.relationship_start_date).getTime() - new Date(a.relationship_start_date).getTime());

            const terminated = enrichedRelationships
                .filter(rel => rel.status === 'terminated')
                .sort((a, b) => new Date(b.relationship_start_date).getTime() - new Date(a.relationship_start_date).getTime());

            return reply.send({
                data: {
                    active,
                    expired,
                    terminated,
                }
            });

        } catch (err: any) {
            console.error('Error fetching candidate recruiters:', err);
            return reply.status(500).send({
                error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recruiter relationships' }
            });
        }
    });
}
