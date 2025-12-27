import { AtsRepository } from '../../repository';
import { getNetworkClient } from '../../clients/network-client';
import { createLogger } from '@splits-network/shared-logging';

const logger = createLogger('CandidatesService');

export interface CandidateFilters {
    clerkUserId: string;
    userRole: 'candidate' | 'recruiter' | 'company' | 'admin';
    search?: string;
    email?: string;
    limit?: number;
    offset?: number;
    scope?: 'mine' | 'all';
}

export interface CreateCandidateParams {
    clerkUserId: string;
    userRole: 'recruiter' | 'admin';
    email: string;
    full_name: string;
    linkedin_url?: string;
}

export interface UpdateCandidateParams {
    clerkUserId: string;
    userRole: 'recruiter' | 'admin';
    candidateId: string;
    updates: Record<string, any>;
    allowSelfManaged?: boolean;
}

export interface SelfUpdateCandidateParams {
    userId: string;  // Clerk user ID
    updates: Record<string, any>;
}

export class CandidatesService {
    constructor(private repository: AtsRepository) {}
    
    private networkClient = getNetworkClient();

    /**
     * Resolve Clerk user ID to entity ID based on role
     */
    private async resolveEntityId(
        clerkUserId: string,
        userRole: string,
        correlationId: string
    ): Promise<{ entityId: string | null; isInactive: boolean }> {
        if (userRole === 'recruiter') {
            const recruiter = await this.networkClient.getRecruiterByUserId(clerkUserId, correlationId);
            if (!recruiter) {
                return { entityId: null, isInactive: true };
            }
            if (recruiter.status !== 'active') {
                return { entityId: recruiter.id, isInactive: true };
            }
            return { entityId: recruiter.id, isInactive: false };
        }
        
        return { entityId: clerkUserId, isInactive: false };
    }

    /**
     * Get candidates with proper filtering based on user role
     * - Recruiters (scope=mine): Candidates they sourced OR have active relationships with
     * - Recruiters (scope=all): All candidates in the system
     * - Admins: All candidates
     * - Others: Forbidden
     */
    async getCandidates(params: CandidateFilters, correlationId: string) {
        const { clerkUserId, userRole, search, email, limit, offset, scope = 'mine' } = params;

        // If email filter is provided, lookup by email directly
        if (email) {
            const candidate = await this.repository.findCandidateByEmail(email);
            return candidate ? [candidate] : [];
        }

        // Platform admins always see all candidates
        if (userRole === 'admin') {
            return this.repository.findAllCandidates({ search, limit, offset });
        }

        // Recruiters can see all candidates or just their own based on scope
        if (userRole === 'recruiter') {
            const { entityId, isInactive } = await this.resolveEntityId(clerkUserId, userRole, correlationId);
            
            if (isInactive) {
                logger.info({ clerkUserId, userRole }, 'Inactive recruiter, returning empty list');
                return [];
            }

            const recruiterId = entityId!;

            // If scope=all, return all candidates but enrich with relationship data
            if (scope === 'all') {
                const allCandidates = await this.repository.findAllCandidates({ search, limit, offset });
                
                // Get this recruiter's relationships to enrich the full list
                let relationshipCandidateIds: string[] = [];
                try {
                    const response = await fetch(
                        `${this.networkClient['baseURL']}/recruiter-candidates/recruiter/${recruiterId}`,
                        {
                            method: 'GET',
                            headers: {
                                'x-correlation-id': correlationId,
                                'Content-Type': 'application/json',
                            },
                            signal: AbortSignal.timeout(5000),
                        }
                    );

                    if (response.ok) {
                        const result = await response.json() as { data: Array<{ candidate_id: string; status: string }> };
                        relationshipCandidateIds = (result.data || [])
                            .filter(rel => rel.status === 'active')
                            .map(rel => rel.candidate_id);
                    }
                } catch (error) {
                    logger.error({ err: error, recruiterId }, 'Failed to fetch recruiter relationships');
                }

                // Enrich all candidates with relationship metadata
                const relationshipCandidateIdSet = new Set(relationshipCandidateIds);
                return allCandidates.map(c => ({
                    ...c,
                    is_sourcer: c.recruiter_id === recruiterId,
                    has_active_relationship: relationshipCandidateIdSet.has(c.id),
                }));
            }
            
            // scope=mine: Get candidates sourced by this recruiter + active relationships

            // Get candidates sourced by this recruiter
            const sourcedCandidates = await this.repository.findAllCandidates({
                search,
                limit,
                offset,
                recruiter_id: recruiterId,
            });

            // Get candidates with active relationships via Network Service
            let relationshipCandidateIds: string[] = [];
            try {
                const response = await fetch(
                    `${this.networkClient['baseURL']}/recruiter-candidates/recruiter/${recruiterId}`,
                    {
                        method: 'GET',
                        headers: {
                            'x-correlation-id': correlationId,
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(5000),
                    }
                );

                if (response.ok) {
                    const result = await response.json() as { data: Array<{ candidate_id: string; status: string }> };
                    relationshipCandidateIds = (result.data || [])
                        .filter(rel => rel.status === 'active')
                        .map(rel => rel.candidate_id);
                }
            } catch (error) {
                logger.error({ err: error, recruiterId }, 'Failed to fetch recruiter relationships');
            }

            // Get relationship candidates not already in sourced list
            const sourcedCandidateIds = new Set(sourcedCandidates.map(c => c.id));
            const relationshipCandidatesToFetch = relationshipCandidateIds.filter(
                id => !sourcedCandidateIds.has(id)
            );

            let relationshipCandidates: any[] = [];
            if (relationshipCandidatesToFetch.length > 0) {
                relationshipCandidates = await Promise.all(
                    relationshipCandidatesToFetch.map(async (id) => {
                        try {
                            return await this.repository.findCandidateById(id);
                        } catch (err) {
                            logger.warn({ err, candidateId: id }, 'Failed to fetch relationship candidate');
                            return null;
                        }
                    })
                );
                relationshipCandidates = relationshipCandidates.filter(c => c !== null);
            }

            // Enrich candidates with relationship metadata
            // Create a set of candidate IDs that have active relationships
            const relationshipCandidateIdSet = new Set(relationshipCandidateIds);

            // Mark sourced candidates (check if they also have active relationships)
            const enrichedSourced = sourcedCandidates.map(c => ({
                ...c,
                is_sourcer: true,
                has_active_relationship: relationshipCandidateIdSet.has(c.id),
            }));

            // Mark relationship candidates
            const enrichedRelationships = relationshipCandidates.map(c => ({
                ...c,
                is_sourcer: false,
                has_active_relationship: true,
            }));

            // Combine and deduplicate
            return [...enrichedSourced, ...enrichedRelationships];
        }

        // If the user reached this point, they were authorized by the API Gateway
        // Return empty list for other roles (though gateway should have blocked them)
        logger.warn({ clerkUserId, userRole }, 'Unexpected role in getCandidates - returning empty list');
        return [];
    }

    /**
     * Get candidate by Clerk user ID
     * Used by candidates to fetch their own profile
     */
    async getCandidateByClerkUserId(clerkUserId: string, correlationId: string) {
        logger.info({ clerkUserId, correlationId }, 'Fetching candidate by Clerk user ID');
        return this.repository.findCandidateByClerkUserId(clerkUserId);
    }

    /**
     * Create a candidate
     * - Recruiters: Create + establish relationship in Network Service
     * - Admins: Create only (no relationship)
     */
    async createCandidate(params: CreateCandidateParams, correlationId: string) {
        const { clerkUserId, userRole, email, full_name, linkedin_url } = params;

        if (!email || !full_name) {
            throw new Error('Missing required fields: email and full_name');
        }

        // Recruiters need active status and create relationship
        if (userRole === 'recruiter') {
            const { entityId, isInactive } = await this.resolveEntityId(clerkUserId, userRole, correlationId);

            if (isInactive) {
                throw new Error('Recruiter profile not found or inactive. Please contact an administrator.');
            }

            const recruiterId = entityId!;

            // Create candidate with recruiter_id
            const candidate = await this.repository.createCandidate({
                email,
                full_name,
                linkedin_url,
                recruiter_id: recruiterId,
                verification_status: 'unverified',
            });

            // Create recruiter-candidate relationship in Network Service
            try {
                const response = await fetch(
                    `${this.networkClient['baseURL']}/recruiter-candidates`,
                    {
                        method: 'POST',
                        headers: {
                            'x-correlation-id': correlationId,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            recruiter_id: recruiterId,
                            candidate_id: candidate.id,
                        }),
                        signal: AbortSignal.timeout(5000),
                    }
                );

                if (!response.ok) {
                    logger.warn(
                        { recruiterId, candidateId: candidate.id, status: response.status },
                        'Failed to create recruiter-candidate relationship'
                    );
                }
            } catch (error) {
                logger.error(
                    { err: error, recruiterId, candidateId: candidate.id },
                    'Error creating recruiter-candidate relationship'
                );
            }

            return candidate;
        }

        // Admins create without relationship
        return this.repository.createCandidate({
            email,
            full_name,
            linkedin_url,
            verification_status: 'unverified',
        });
    }

    /**
     * Update a candidate
     * - Recruiters: Must have active relationship
     * - Admins: Can update any
     * - Self-managed candidates: Cannot be updated by recruiters/admins
     */
    async updateCandidate(params: UpdateCandidateParams, correlationId: string) {
        const { clerkUserId, userRole, candidateId, updates, allowSelfManaged } = params;

        // Get candidate to check if self-managed
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        // Cannot update self-managed candidates unless explicitly allowed
        if (candidate.user_id && !allowSelfManaged) {
            throw new Error('Cannot update self-managed candidate profile');
        }

        // Admins can update any
        if (userRole === 'admin') {
            return this.repository.updateCandidate(candidateId, updates);
        }

        // Recruiters must have active relationship
        if (userRole === 'recruiter') {
            const { entityId, isInactive } = await this.resolveEntityId(clerkUserId, userRole, correlationId);

            if (isInactive) {
                throw new Error('Recruiter profile not found or inactive');
            }

            const recruiterId = entityId!;

            // Check for active relationship
            try {
                const response = await fetch(
                    `${this.networkClient['baseURL']}/recruiter-candidates/${recruiterId}/${candidateId}`,
                    {
                        method: 'GET',
                        headers: {
                            'x-correlation-id': correlationId,
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(5000),
                    }
                );

                if (!response.ok || response.status === 404) {
                    throw new Error('You do not have permission to update this candidate. An active recruiter-candidate relationship is required.');
                }

                const result = await response.json() as { data: { status: string } };
                if (result.data.status !== 'active') {
                    throw new Error('You do not have permission to update this candidate. An active recruiter-candidate relationship is required.');
                }
            } catch (error) {
                if (error instanceof Error && error.message.includes('permission')) {
                    throw error;
                }
                logger.error({ err: error, recruiterId, candidateId }, 'Failed to check recruiter relationship');
                throw new Error('Failed to verify permissions');
            }

            return this.repository.updateCandidate(candidateId, updates);
        }

        throw new Error('Forbidden: Only recruiters and admins can update candidates');
    }

    /**
     * Self-service update for candidates
     */
    async selfUpdateCandidate(params: SelfUpdateCandidateParams, correlationId: string) {
        const { userId, updates } = params;

        // Find candidate by user_id (Clerk user ID)
        const candidates = await this.repository.findAllCandidates({ limit: 1000 });
        const candidate = candidates.find(c => c.user_id === userId);
        
        if (!candidate) {
            throw new Error('Candidate profile not found');
        }

        // Verify this is a self-managed candidate (should always be true if user_id matches)
        if (!candidate.user_id) {
            throw new Error('This candidate profile is not self-managed. Please contact your recruiter to update your profile.');
        }

        // Update with self-managed flag
        return this.repository.updateCandidate(candidate.id, updates);
    }

    /**
     * Get candidate applications (self-service)
     */
    async getSelfApplications(userId: string, correlationId: string) {
        // Find candidate by user_id (Clerk user ID)
        const candidates = await this.repository.findAllCandidates({ limit: 1000 });
        const candidate = candidates.find(c => c.user_id === userId);
        
        if (!candidate) {
            return []; // No candidate record yet
        }

        const candidateId = candidate.id;

        // Get applications with enriched job data
        const applications = await this.repository.findApplications({
            candidate_id: candidateId,
        });

        // Enrich with job and company details
        const enrichedApplications = await Promise.all(
            applications.map(async (app) => {
                try {
                    // Get job with company data
                    const job = await this.repository.findJobById(app.job_id);
                    if (!job) {
                        return app;
                    }

                    // Get company data
                    const company = await this.repository.findCompanyById(job.company_id);

                    return { 
                        ...app, 
                        job: {
                            ...job,
                            company: company ?? undefined
                        }
                    };
                } catch (error) {
                    logger.warn({ error, jobId: app.job_id }, 'Failed to fetch job for application');
                    return app;
                }
            })
        );

        return enrichedApplications;
    }

    /**
     * Phase 2: Source candidate (mark as sourced by recruiter)
     */
    async sourceCandidate(
        params: {
            clerkUserId: string;
            userRole: 'recruiter';
            candidateId: string;
            sourceData: Record<string, any>;
        },
        correlationId: string
    ) {
        const { clerkUserId, candidateId, sourceData } = params;

        // Resolve recruiter ID
        const { entityId: recruiterId, isInactive } = await this.resolveEntityId(clerkUserId, 'recruiter', correlationId);
        if (isInactive || !recruiterId) {
            throw new Error('Recruiter profile must be active to source candidates');
        }

        // Verify candidate exists
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        // In Phase 1, recruiter_id is set when candidate is created
        // In Phase 2, this would create a record in candidate_sourcer table
        // For now, just log and return success
        logger.info({ candidateId, recruiterId, sourceData, correlationId }, 'Candidate sourcing recorded');

        return {
            success: true,
            candidate_id: candidateId,
            recruiter_id: recruiterId,
            sourced_at: new Date().toISOString(),
        };
    }

    /**
     * Phase 2: Get candidate sourcer information
     */
    async getCandidateSourcer(candidateId: string, correlationId: string) {
        // Get candidate
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        // If no recruiter_id, candidate wasn't sourced
        if (!candidate.recruiter_id) {
            return null;
        }

        // Fetch recruiter details from Network Service
        try {
            const recruiter = await this.networkClient.getRecruiterById(candidate.recruiter_id, correlationId);
            return recruiter;
        } catch (error) {
            logger.warn({ error, recruiterId: candidate.recruiter_id, correlationId }, 'Failed to fetch recruiter details');
            return { id: candidate.recruiter_id }; // Return minimal info if fetch fails
        }
    }

    /**
     * Phase 2: Record outreach to candidate
     */
    async recordOutreach(
        params: {
            clerkUserId: string;
            userRole: 'recruiter';
            candidateId: string;
            outreachData: Record<string, any>;
        },
        correlationId: string
    ) {
        const { clerkUserId, candidateId, outreachData } = params;

        // Resolve recruiter ID
        const { entityId: recruiterId, isInactive } = await this.resolveEntityId(clerkUserId, 'recruiter', correlationId);
        if (isInactive || !recruiterId) {
            throw new Error('Recruiter profile must be active to record outreach');
        }

        // Verify candidate exists
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        // TODO: In Phase 2, this should create a record in an outreach/activity table
        // For now, we'll just log it and return success
        logger.info({
            candidateId,
            recruiterId,
            outreachData,
            correlationId,
        }, 'Recruiter outreach recorded');

        return {
            success: true,
            candidate_id: candidateId,
            recruiter_id: recruiterId,
            recorded_at: new Date().toISOString(),
        };
    }
}
