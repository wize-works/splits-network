import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AutomationRule } from '@splits-network/shared-types';
import { MatchingService } from './matching-service';
import { FraudDetectionService } from './fraud-service';
import { AutomationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';

export function registerRoutes(
    app: FastifyInstance,
    matchingService: MatchingService,
    fraudService: FraudDetectionService,
    repository: AutomationRepository,
    logger: Logger
) {
    // ========================================================================
    // AI Candidate Matching
    // ========================================================================

    /**
     * Get pending match suggestions for human review
     */
    app.get('/matches/pending', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const matches = await matchingService.getPendingMatches(50);
            return reply.send({ data: matches });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch pending matches');
            return reply.status(500).send({ error: 'Failed to fetch pending matches' });
        }
    });

    /**
     * Review a match suggestion
     */
    app.post(
        '/matches/:match_id/review',
        async (
            request: FastifyRequest<{
                Params: { match_id: string };
                Body: {
                    reviewed_by: string;
                    accepted: boolean;
                    rejection_reason?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const match = await matchingService.reviewMatch(
                    request.params.match_id,
                    request.body.reviewed_by,
                    request.body.accepted,
                    request.body.rejection_reason
                );
                return reply.send({ data: match });
            } catch (error) {
                logger.error({ error }, 'Failed to review match');
                return reply.status(500).send({ error: 'Failed to review match' });
            }
        }
    );

    /**
     * Generate match suggestions for a candidate (admin/system)
     */
    app.post(
        '/matches/generate',
        async (
            request: FastifyRequest<{
                Body: {
                    candidate_id: string;
                    candidate_data: any;
                    jobs: any[];
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const matches = await matchingService.suggestMatchesForCandidate(
                    request.body.candidate_id,
                    request.body.candidate_data,
                    request.body.jobs
                );
                return reply.send({ data: matches });
            } catch (error) {
                logger.error({ error }, 'Failed to generate matches');
                return reply.status(500).send({ error: 'Failed to generate matches' });
            }
        }
    );

    // ========================================================================
    // Fraud Detection
    // ========================================================================

    /**
     * Get active fraud signals
     */
    app.get('/fraud/signals', async (
        request: FastifyRequest<{
            Querystring: {
                severity?: string;
                recruiter_id?: string;
            };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const signals = await fraudService.getActiveSignals({
                severity: request.query.severity as any,
                recruiter_id: request.query.recruiter_id,
            });
            return reply.send({ data: signals });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch fraud signals');
            return reply.status(500).send({ error: 'Failed to fetch fraud signals' });
        }
    });

    /**
     * Resolve a fraud signal
     */
    app.post(
        '/fraud/signals/:signal_id/resolve',
        async (
            request: FastifyRequest<{
                Params: { signal_id: string };
                Body: {
                    reviewed_by: string;
                    is_false_positive: boolean;
                    notes?: string;
                    action_taken?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const signal = await fraudService.resolveSignal(
                    request.params.signal_id,
                    request.body.reviewed_by,
                    {
                        is_false_positive: request.body.is_false_positive,
                        notes: request.body.notes,
                        action_taken: request.body.action_taken,
                    }
                );
                return reply.send({ data: signal });
            } catch (error) {
                logger.error({ error }, 'Failed to resolve fraud signal');
                return reply.status(500).send({ error: 'Failed to resolve fraud signal' });
            }
        }
    );

    // ========================================================================
    // Decision Audit Logs
    // ========================================================================

    /**
     * Get decision audit logs
     */
    app.get('/audit/decisions', async (
        request: FastifyRequest<{
            Querystring: {
                entity_type?: string;
                entity_id?: string;
                decision_type?: string;
                limit?: string;
            };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const logs = await repository.findDecisionLogs({
                entity_type: request.query.entity_type,
                entity_id: request.query.entity_id,
                decision_type: request.query.decision_type,
                limit: request.query.limit ? parseInt(request.query.limit) : 100,
            });
            return reply.send({ data: logs });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch decision logs');
            return reply.status(500).send({ error: 'Failed to fetch decision logs' });
        }
    });

    // ========================================================================
    // Automation Rules Management
    // ========================================================================

    /**
     * Get active automation rules
     */
    app.get('/rules', async (
        request: FastifyRequest<{
            Querystring: { rule_type?: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const rules = await repository.findActiveRules(request.query.rule_type);
            return reply.send({ data: rules });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch automation rules');
            return reply.status(500).send({ error: 'Failed to fetch automation rules' });
        }
    });

    /**
     * Create automation rule (admin only)
     */
    app.post('/rules', async (
        request: FastifyRequest<{ Body: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'> }>,
        reply: FastifyReply
    ) => {
        try {
            const rule = await repository.createRule(request.body);
            return reply.status(201).send({ data: rule });
        } catch (error) {
            logger.error({ error }, 'Failed to create automation rule');
            return reply.status(500).send({ error: 'Failed to create automation rule' });
        }
    });

    /**
     * Update automation rule status (admin only)
     */
    app.patch('/rules/:rule_id', async (
        request: FastifyRequest<{
            Params: { rule_id: string };
            Body: Partial<Pick<AutomationRule, 'status' | 'name' | 'description'>>;
        }>,
        reply: FastifyReply
    ) => {
        try {
            const rule = await repository.updateRule(request.params.rule_id, request.body);
            return reply.send({ data: rule });
        } catch (error) {
            logger.error({ error }, 'Failed to update automation rule');
            return reply.status(500).send({ error: 'Failed to update automation rule' });
        }
    });
}
