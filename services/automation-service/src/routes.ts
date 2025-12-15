import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AutomationRule } from '@splits-network/shared-types';
import { MatchingService } from './matching-service';
import { FraudDetectionService } from './fraud-service';
import { AutomationExecutor } from './automation-executor';
import { MetricsAggregationService } from './metrics-service';
import { AutomationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';

export function registerRoutes(
    app: FastifyInstance,
    matchingService: MatchingService,
    fraudService: FraudDetectionService,
    automationExecutor: AutomationExecutor,
    metricsService: MetricsAggregationService,
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

    // ========================================================================
    // Automation Execution Management
    // ========================================================================

    /**
     * Get pending executions requiring approval
     */
    app.get('/executions/pending', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const executions = await automationExecutor.getPendingExecutions(50);
            return reply.send({ data: executions });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch pending executions');
            return reply.status(500).send({ error: 'Failed to fetch pending executions' });
        }
    });

    /**
     * Get execution history for a rule
     */
    app.get('/rules/:rule_id/executions', async (
        request: FastifyRequest<{
            Params: { rule_id: string };
            Querystring: { limit?: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const limit = request.query.limit ? parseInt(request.query.limit) : 100;
            const executions = await automationExecutor.getRuleExecutionHistory(
                request.params.rule_id,
                limit
            );
            return reply.send({ data: executions });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch execution history');
            return reply.status(500).send({ error: 'Failed to fetch execution history' });
        }
    });

    /**
     * Execute an automation rule
     */
    app.post('/executions', async (
        request: FastifyRequest<{
            Body: {
                rule_id: string;
                triggered_by: string;
                trigger_data: any;
                requires_approval?: boolean;
            };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const execution = await automationExecutor.executeRule(
                request.body.rule_id,
                request.body.triggered_by,
                request.body.trigger_data,
                request.body.requires_approval !== false
            );
            return reply.status(201).send({ data: execution });
        } catch (error: any) {
            logger.error({ error }, 'Failed to execute automation rule');
            return reply.status(500).send({ error: error.message || 'Failed to execute automation rule' });
        }
    });

    /**
     * Approve a pending execution
     */
    app.post('/executions/:execution_id/approve', async (
        request: FastifyRequest<{
            Params: { execution_id: string };
            Body: { approved_by: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const execution = await automationExecutor.approveExecution(
                request.params.execution_id,
                request.body.approved_by
            );
            return reply.send({ data: execution });
        } catch (error: any) {
            logger.error({ error }, 'Failed to approve execution');
            return reply.status(500).send({ error: error.message || 'Failed to approve execution' });
        }
    });

    /**
     * Reject a pending execution
     */
    app.post('/executions/:execution_id/reject', async (
        request: FastifyRequest<{
            Params: { execution_id: string };
            Body: {
                rejected_by: string;
                rejection_reason: string;
            };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const execution = await automationExecutor.rejectExecution(
                request.params.execution_id,
                request.body.rejected_by,
                request.body.rejection_reason
            );
            return reply.send({ data: execution });
        } catch (error: any) {
            logger.error({ error }, 'Failed to reject execution');
            return reply.status(500).send({ error: error.message || 'Failed to reject execution' });
        }
    });

    // ========================================================================
    // Marketplace Metrics
    // ========================================================================

    /**
     * Trigger daily metrics aggregation (admin/cron)
     */
    app.post('/metrics/aggregate', async (
        request: FastifyRequest<{
            Body: { date?: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const date = request.body.date ? new Date(request.body.date) : new Date();
            await metricsService.aggregateDailyMetrics(date);
            return reply.send({ 
                success: true,
                message: 'Daily metrics aggregated successfully',
                date: date.toISOString().split('T')[0],
            });
        } catch (error: any) {
            logger.error({ error }, 'Failed to aggregate metrics');
            return reply.status(500).send({ error: error.message || 'Failed to aggregate metrics' });
        }
    });

    /**
     * Get metrics for a specific date
     */
    app.get('/metrics/daily/:date', async (
        request: FastifyRequest<{
            Params: { date: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const metrics = await repository.getMetricsForDate(request.params.date);
            if (!metrics) {
                return reply.status(404).send({ error: 'Metrics not found for date' });
            }
            return reply.send({ data: metrics });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch metrics');
            return reply.status(500).send({ error: 'Failed to fetch metrics' });
        }
    });

    /**
     * Get metrics for a date range
     */
    app.get('/metrics/range', async (
        request: FastifyRequest<{
            Querystring: { start_date: string; end_date: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const metrics = await repository.getMetricsRange(
                request.query.start_date,
                request.query.end_date
            );
            return reply.send({ data: metrics });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch metrics range');
            return reply.status(500).send({ error: 'Failed to fetch metrics range' });
        }
    });

    /**
     * Get recent metrics (last N days)
     */
    app.get('/metrics/recent', async (
        request: FastifyRequest<{
            Querystring: { days?: string };
        }>,
        reply: FastifyReply
    ) => {
        try {
            const days = request.query.days ? parseInt(request.query.days) : 7;
            const metrics = await repository.getRecentMetrics(days);
            return reply.send({ data: metrics });
        } catch (error) {
            logger.error({ error }, 'Failed to fetch recent metrics');
            return reply.status(500).send({ error: 'Failed to fetch recent metrics' });
        }
    });

    /**
     * Get marketplace health score
     */
    app.get('/metrics/health', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const score = await metricsService.calculateHealthScore();
            return reply.send({ 
                health_score: score,
                status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
            });
        } catch (error) {
            logger.error({ error }, 'Failed to calculate health score');
            return reply.status(500).send({ error: 'Failed to calculate health score' });
        }
    });
}
