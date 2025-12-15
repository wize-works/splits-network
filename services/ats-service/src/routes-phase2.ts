import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CandidateOwnershipService, PlacementCollaborationService } from './ownership';
import { PlacementLifecycleService } from './placement-lifecycle';
import { BadRequestError, NotFoundError } from '@splits-network/shared-fastify';

/**
 * Phase 2 Routes for ATS Service
 * - Candidate ownership and sourcing
 * - Placement lifecycle management
 * - Multi-recruiter collaboration
 */
export function registerPhase2Routes(
    app: FastifyInstance,
    ownershipService: CandidateOwnershipService,
    collaborationService: PlacementCollaborationService,
    lifecycleService: PlacementLifecycleService
) {
    // ========================================================================
    // Candidate Ownership & Sourcing Routes
    // ========================================================================

    // List all candidate sourcers (admin)
    app.get(
        '/candidates/sourcers',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Get all candidate sourcing records (admin)',
                querystring: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['active', 'expired', 'all'], default: 'all' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{ Querystring: { status?: string } }>,
            reply: FastifyReply
        ) => {
            const sourcers = await ownershipService.getAllSourcers(request.query.status);
            return reply.send({ data: sourcers });
        }
    );

    // Establish sourcing for a candidate
    app.post(
        '/candidates/:candidateId/source',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Establish sourcing ownership of a candidate',
                params: {
                    type: 'object',
                    properties: {
                        candidateId: { type: 'string' }
                    }
                },
                body: {
                    type: 'object',
                    required: ['sourcer_user_id'],
                    properties: {
                        sourcer_user_id: { type: 'string' },
                        sourcer_type: { type: 'string', enum: ['recruiter', 'tsn'], default: 'recruiter' },
                        protection_window_days: { type: 'number', default: 365 },
                        notes: { type: 'string' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { candidateId: string };
                Body: {
                    sourcer_user_id: string;
                    sourcer_type?: 'recruiter' | 'tsn';
                    protection_window_days?: number;
                    notes?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            const { candidateId } = request.params;
            const { sourcer_user_id, sourcer_type, protection_window_days, notes } = request.body;

            const sourcer = await ownershipService.sourceCandidate(
                candidateId,
                sourcer_user_id,
                sourcer_type,
                protection_window_days,
                notes
            );

            return reply.status(201).send({ data: sourcer });
        }
    );

    // Get candidate sourcer/ownership info
    app.get(
        '/candidates/:candidateId/sourcer',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Get sourcing/ownership information for a candidate',
            }
        },
        async (
            request: FastifyRequest<{ Params: { candidateId: string } }>,
            reply: FastifyReply
        ) => {
            const sourcer = await ownershipService.getCandidateSourcer(request.params.candidateId);
            if (!sourcer) {
                return reply.send({ data: null, message: 'No sourcer established' });
            }
            return reply.send({ data: sourcer });
        }
    );

    // Check if user can work with candidate
    app.get(
        '/candidates/:candidateId/can-work/:userId',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Check if a user can work with a candidate (ownership check)',
            }
        },
        async (
            request: FastifyRequest<{ Params: { candidateId: string; userId: string } }>,
            reply: FastifyReply
        ) => {
            const { candidateId, userId } = request.params;
            const canWork = await ownershipService.canUserWorkWithCandidate(candidateId, userId);
            return reply.send({ data: { can_work: canWork } });
        }
    );

    // Record outreach to candidate
    app.post(
        '/candidates/:candidateId/outreach',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Record outreach email to candidate (establishes ownership if first contact)',
                body: {
                    type: 'object',
                    required: ['recruiter_user_id', 'email_subject', 'email_body'],
                    properties: {
                        recruiter_user_id: { type: 'string' },
                        job_id: { type: 'string' },
                        email_subject: { type: 'string' },
                        email_body: { type: 'string' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { candidateId: string };
                Body: {
                    recruiter_user_id: string;
                    job_id?: string;
                    email_subject: string;
                    email_body: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            const { candidateId } = request.params;
            const { recruiter_user_id, job_id, email_subject, email_body } = request.body;

            const outreach = await ownershipService.recordOutreach(
                candidateId,
                recruiter_user_id,
                email_subject,
                email_body,
                job_id
            );

            return reply.status(201).send({ data: outreach });
        }
    );

    // Get outreach history for candidate
    app.get(
        '/candidates/:candidateId/outreach',
        {
            schema: {
                tags: ['phase2-ownership'],
                summary: 'Get outreach history for a candidate',
            }
        },
        async (
            request: FastifyRequest<{ Params: { candidateId: string } }>,
            reply: FastifyReply
        ) => {
            const outreach = await ownershipService.getCandidateOutreach(request.params.candidateId);
            return reply.send({ data: outreach });
        }
    );

    // ========================================================================
    // Placement Lifecycle Routes
    // ========================================================================

    // Activate a placement (start guarantee period)
    app.post(
        '/placements/:placementId/activate',
        {
            schema: {
                tags: ['phase2-placements'],
                summary: 'Activate a placement and start guarantee period',
                body: {
                    type: 'object',
                    required: ['start_date'],
                    properties: {
                        start_date: { type: 'string', format: 'date' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { placementId: string };
                Body: { start_date: string };
            }>,
            reply: FastifyReply
        ) => {
            const { placementId } = request.params;
            const { start_date } = request.body;

            const placement = await lifecycleService.activatePlacement(
                placementId,
                new Date(start_date)
            );

            return reply.send({ data: placement });
        }
    );

    // Complete a placement
    app.post(
        '/placements/:placementId/complete',
        {
            schema: {
                tags: ['phase2-placements'],
                summary: 'Mark placement as successfully completed',
                body: {
                    type: 'object',
                    required: ['end_date'],
                    properties: {
                        end_date: { type: 'string', format: 'date' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { placementId: string };
                Body: { end_date: string };
            }>,
            reply: FastifyReply
        ) => {
            const { placementId } = request.params;
            const { end_date } = request.body;

            const placement = await lifecycleService.completePlacement(
                placementId,
                new Date(end_date)
            );

            return reply.send({ data: placement });
        }
    );

    // Fail a placement
    app.post(
        '/placements/:placementId/fail',
        {
            schema: {
                tags: ['phase2-placements'],
                summary: 'Mark placement as failed',
                body: {
                    type: 'object',
                    properties: {
                        failure_reason: { type: 'string' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { placementId: string };
                Body: { failure_reason?: string };
            }>,
            reply: FastifyReply
        ) => {
            const { placementId } = request.params;
            const { failure_reason } = request.body;

            const placement = await lifecycleService.failPlacement(placementId, failure_reason);

            return reply.send({ data: placement });
        }
    );

    // Request replacement for failed placement
    app.post(
        '/placements/:placementId/request-replacement',
        {
            schema: {
                tags: ['phase2-placements'],
                summary: 'Request replacement for a failed placement within guarantee period',
            }
        },
        async (
            request: FastifyRequest<{ Params: { placementId: string } }>,
            reply: FastifyReply
        ) => {
            await lifecycleService.requestReplacement(request.params.placementId);
            return reply.send({ data: { message: 'Replacement requested' } });
        }
    );

    // ========================================================================
    // Multi-Recruiter Collaboration Routes
    // ========================================================================

    // Add collaborator to placement
    app.post(
        '/placements/:placementId/collaborators',
        {
            schema: {
                tags: ['phase2-collaboration'],
                summary: 'Add a collaborator to a placement with role and split',
                body: {
                    type: 'object',
                    required: ['recruiter_user_id', 'role', 'split_percentage', 'split_amount'],
                    properties: {
                        recruiter_user_id: { type: 'string' },
                        role: { type: 'string', enum: ['sourcer', 'submitter', 'closer', 'support'] },
                        split_percentage: { type: 'number' },
                        split_amount: { type: 'number' },
                        notes: { type: 'string' }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Params: { placementId: string };
                Body: {
                    recruiter_user_id: string;
                    role: 'sourcer' | 'submitter' | 'closer' | 'support';
                    split_percentage: number;
                    split_amount: number;
                    notes?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            const { placementId } = request.params;
            const { recruiter_user_id, role, split_percentage, split_amount, notes } = request.body;

            const collaborator = await collaborationService.addCollaborator(
                placementId,
                recruiter_user_id,
                role,
                split_percentage,
                split_amount,
                notes
            );

            return reply.status(201).send({ data: collaborator });
        }
    );

    // Get collaborators for placement
    app.get(
        '/placements/:placementId/collaborators',
        {
            schema: {
                tags: ['phase2-collaboration'],
                summary: 'Get all collaborators for a placement',
            }
        },
        async (
            request: FastifyRequest<{ Params: { placementId: string } }>,
            reply: FastifyReply
        ) => {
            const collaborators = await collaborationService.getPlacementCollaborators(
                request.params.placementId
            );
            return reply.send({ data: collaborators });
        }
    );

    // Calculate split recommendations
    app.post(
        '/placements/calculate-splits',
        {
            schema: {
                tags: ['phase2-collaboration'],
                summary: 'Calculate recommended splits for multi-recruiter collaboration',
                body: {
                    type: 'object',
                    required: ['total_recruiter_share', 'roles'],
                    properties: {
                        total_recruiter_share: { type: 'number' },
                        roles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['role'],
                                properties: {
                                    role: { type: 'string', enum: ['sourcer', 'submitter', 'closer', 'support'] },
                                    weight: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        },
        async (
            request: FastifyRequest<{
                Body: {
                    total_recruiter_share: number;
                    roles: Array<{ role: 'sourcer' | 'submitter' | 'closer' | 'support'; weight?: number }>;
                };
            }>,
            reply: FastifyReply
        ) => {
            const { total_recruiter_share, roles } = request.body;

            const splits = collaborationService.calculateCollaboratorSplits(
                total_recruiter_share,
                roles
            );

            return reply.send({ data: splits });
        }
    );
}
