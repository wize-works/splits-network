import { FastifyInstance } from 'fastify';
import { ProposalService, UserRole } from '../../services/proposals/service';
import { ProposalFilters } from '@splits-network/shared-types';
import { AtsRepository } from '../../repository';

/**
 * Unified Proposals Routes
 * 
 * Handles all proposal workflows across the platform.
 * 
 * Receives Clerk user ID from API Gateway (in x-clerk-user-id header)
 * and resolves to role-specific entity IDs internally via ProposalService.
 * 
 * This keeps business logic in the service layer, not in the API Gateway.
 * 
 * @see docs/guidance/unified-proposals-system.md
 */
export async function proposalRoutes(fastify: FastifyInstance, repository: AtsRepository) {
    const proposalService = new ProposalService(repository);

    /**
     * Extract Clerk user context from headers set by API Gateway
     */
    function getUserContext(request: any): { clerkUserId: string; userRole: UserRole } | null {
        const clerkUserId = request.headers['x-clerk-user-id'];
        const userRole = request.headers['x-user-role'] as UserRole;
        
        if (!clerkUserId || !userRole) {
            return null;
        }
        
        return { clerkUserId, userRole };
    }

    /**
     * GET /api/proposals
     * Get all proposals for current user
     */
    fastify.get('/api/proposals', async (request, reply) => {
        const userContext = getUserContext(request);
        if (!userContext) {
            return reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
        }

        const { clerkUserId, userRole } = userContext;
        const correlationId = (request as any).correlationId;
        const query = request.query as any;

        const filters: ProposalFilters = {
            type: query.type,
            state: query.state,
            search: query.search as string,
            sort_by: query.sort_by,
            sort_order: query.sort_order,
            page: query.page ? parseInt(query.page) : 1,
            limit: query.limit ? parseInt(query.limit) : 25,
            urgent_only: query.urgent_only === 'true'
        };

        const result = await proposalService.getProposalsForUser(clerkUserId, userRole, filters, correlationId);
        return reply.send({ data: result });
    });

    /**
     * GET /api/proposals/actionable
     * Get proposals requiring current user's action
     */
    fastify.get('/api/proposals/actionable', async (request, reply) => {
        const userContext = getUserContext(request);
        if (!userContext) {
            return reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
        }

        const { clerkUserId, userRole } = userContext;
        const correlationId = (request as any).correlationId;
        const proposals = await proposalService.getActionableProposals(clerkUserId, userRole, correlationId);
        return reply.send({ data: proposals });
    });

    /**
     * GET /api/proposals/pending
     * Get proposals awaiting response from others
     */
    fastify.get('/api/proposals/pending', async (request, reply) => {
        const userContext = getUserContext(request);
        if (!userContext) {
            return reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
        }

        const { clerkUserId, userRole } = userContext;
        const correlationId = (request as any).correlationId;
        const proposals = await proposalService.getPendingProposals(clerkUserId, userRole, correlationId);
        return reply.send({ data: proposals });
    });

    /**
     * GET /api/proposals/:id
     * Get single proposal details
     */
    fastify.get<{ Params: { id: string } }>(
        '/api/proposals/:id',
        async (request, reply) => {
            const userContext = getUserContext(request);
            if (!userContext) {
                return reply.code(401).send({
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
                });
            }

            const { clerkUserId, userRole } = userContext;
            const correlationId = (request as any).correlationId;
            const proposalId = request.params.id;

            // Get application via repository
            const application = await repository.findApplicationById(proposalId);
            if (!application) {
                return reply.code(404).send({
                    error: { code: 'NOT_FOUND', message: 'Proposal not found' }
                });
            }

            // Get the job to access company_id for permission check
            const job = application.job || await repository.findJobById(application.job_id);
            if (!job) {
                return reply.code(404).send({
                    error: { code: 'NOT_FOUND', message: 'Associated job not found' }
                });
            }

            // Resolve Clerk user ID to entity ID for permission check
            const entityId = await proposalService.resolveEntityId(clerkUserId, userRole, correlationId);
            if (!entityId) {
                return reply.code(403).send({
                    error: { code: 'FORBIDDEN', message: 'Access denied' }
                });
            }

            // Check access permissions using resolved entity ID
            const hasAccess = 
                userRole === 'admin' ||
                (userRole === 'recruiter' && application.recruiter_id === entityId) ||
                (userRole === 'candidate' && application.candidate_id === entityId) ||
                (userRole === 'company' && job.company_id === entityId);

            if (!hasAccess) {
                return reply.code(403).send({
                    error: { code: 'FORBIDDEN', message: 'Access denied' }
                });
            }

            // Enrich as proposal (pass entityId for permission calculations)
            const proposal = await proposalService.enrichApplicationAsProposal(
                application,
                entityId,
                userRole
            );

            return reply.send({ data: proposal });
        }
    );

    /**
     * GET /api/proposals/summary
     * Get summary statistics for current user
     */
    fastify.get('/api/proposals/summary', async (request, reply) => {
        const userContext = getUserContext(request);
        if (!userContext) {
            return reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
        }

        const { clerkUserId, userRole } = userContext;
        const correlationId = (request as any).correlationId;
        // Get first page to calculate summary
        const result = await proposalService.getProposalsForUser(clerkUserId, userRole, {
            page: 1,
            limit: 100  // Get more items for accurate summary
        }, correlationId);

        return reply.send({ data: result.summary });
    });
}
