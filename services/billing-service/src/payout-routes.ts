import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from './service';
import { PayoutService } from './payout-service';
import Stripe from 'stripe';
import { Logger } from '@splits-network/shared-logging';

export function registerPayoutRoutes(
    app: FastifyInstance,
    service: BillingService,
    payoutService: PayoutService,
    stripe: Stripe,
    logger: Logger
) {
    // ========================================================================
    // Stripe Connect Onboarding
    // ========================================================================

    /**
     * Create Stripe Connect account link for recruiter onboarding
     */
    app.post(
        '/stripe/connect/onboard',
        async (
            request: FastifyRequest<{ Body: { recruiter_id: string; return_url: string; refresh_url: string } }>,
            reply: FastifyReply
        ) => {
            const { recruiter_id, return_url, refresh_url } = request.body;

            try {
                // Create Stripe Connect account if it doesn't exist
                let accountId: string;
                
                // Check if recruiter already has account
                // (In production, fetch from network-service or database)
                const account = await stripe.accounts.create({
                    type: 'express',
                    metadata: {
                        recruiter_id,
                    },
                });

                accountId = account.id;
                logger.info({ recruiterId: recruiter_id, accountId }, 'Created Stripe Connect account');

                // Create account link for onboarding
                const accountLink = await stripe.accountLinks.create({
                    account: accountId,
                    refresh_url,
                    return_url,
                    type: 'account_onboarding',
                });

                return reply.send({
                    data: {
                        account_id: accountId,
                        onboarding_url: accountLink.url,
                    },
                });
            } catch (error) {
                logger.error({ error, recruiterId: recruiter_id }, 'Failed to create onboarding link');
                return reply.status(500).send({ error: 'Failed to create onboarding link' });
            }
        }
    );

    /**
     * Check Stripe Connect account status
     */
    app.get(
        '/stripe/connect/status/:account_id',
        async (
            request: FastifyRequest<{ Params: { account_id: string } }>,
            reply: FastifyReply
        ) => {
            const { account_id } = request.params;

            try {
                const account = await stripe.accounts.retrieve(account_id);

                return reply.send({
                    data: {
                        id: account.id,
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                        details_submitted: account.details_submitted,
                        requirements: account.requirements,
                    },
                });
            } catch (error) {
                logger.error({ error, accountId: account_id }, 'Failed to retrieve account status');
                return reply.status(500).send({ error: 'Failed to retrieve account status' });
            }
        }
    );

    // ========================================================================
    // Payout Management
    // ========================================================================

    /**
     * Create a payout (admin only)
     */
    app.post(
        '/payouts',
        async (
            request: FastifyRequest<{
                Body: {
                    placement_id: string;
                    recruiter_id: string;
                    placement_fee: number;
                    recruiter_share_percentage: number;
                    payout_amount: number;
                    holdback_amount?: number;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const payout = await payoutService.createPayout({
                    placementId: request.body.placement_id,
                    recruiterId: request.body.recruiter_id,
                    placementFee: request.body.placement_fee,
                    recruiterSharePercentage: request.body.recruiter_share_percentage,
                    payoutAmount: request.body.payout_amount,
                    holdbackAmount: request.body.holdback_amount,
                    createdBy: 'admin', // TODO: Get from auth context
                });

                return reply.status(201).send({ data: payout });
            } catch (error) {
                logger.error({ error }, 'Failed to create payout');
                return reply.status(500).send({ error: 'Failed to create payout' });
            }
        }
    );

    /**
     * Process a payout (admin only)
     */
    app.post(
        '/payouts/:id/process',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const payout = await payoutService.processPayout(request.params.id);
                return reply.send({ data: payout });
            } catch (error) {
                logger.error({ error, payoutId: request.params.id }, 'Failed to process payout');
                return reply.status(500).send({
                    error: error instanceof Error ? error.message : 'Failed to process payout',
                });
            }
        }
    );

    /**
     * Get payout by ID
     */
    app.get(
        '/payouts/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const payout = await payoutService.getPlacementPayouts(request.params.id);
                return reply.send({ data: payout });
            } catch (error) {
                return reply.status(404).send({ error: 'Payout not found' });
            }
        }
    );

    /**
     * Get payouts for a recruiter
     */
    app.get(
        '/recruiters/:recruiter_id/payouts',
        async (
            request: FastifyRequest<{ Params: { recruiter_id: string } }>,
            reply: FastifyReply
        ) => {
            try {
                const payouts = await payoutService.getRecruiterPayouts(request.params.recruiter_id);
                return reply.send({ data: payouts });
            } catch (error) {
                logger.error({ error }, 'Failed to fetch recruiter payouts');
                return reply.status(500).send({ error: 'Failed to fetch payouts' });
            }
        }
    );

    /**
     * Get payouts for a placement
     */
    app.get(
        '/placements/:placement_id/payouts',
        async (
            request: FastifyRequest<{ Params: { placement_id: string } }>,
            reply: FastifyReply
        ) => {
            try {
                const payouts = await payoutService.getPlacementPayouts(request.params.placement_id);
                return reply.send({ data: payouts });
            } catch (error) {
                logger.error({ error }, 'Failed to fetch placement payouts');
                return reply.status(500).send({ error: 'Failed to fetch payouts' });
            }
        }
    );

    /**
     * Get payout audit log
     */
    app.get(
        '/payouts/:id/audit-log',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const auditLog = await payoutService.getPayoutAuditLog(request.params.id);
                return reply.send({ data: auditLog });
            } catch (error) {
                logger.error({ error }, 'Failed to fetch audit log');
                return reply.status(500).send({ error: 'Failed to fetch audit log' });
            }
        }
    );

    /**
     * Schedule a payout
     */
    app.post(
        '/payouts/schedule',
        async (
            request: FastifyRequest<{
                Body: {
                    placement_id: string;
                    scheduled_date: string;
                    trigger_event: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const schedule = await payoutService.schedulePayout(
                    request.body.placement_id,
                    new Date(request.body.scheduled_date),
                    request.body.trigger_event
                );

                return reply.status(201).send({ data: schedule });
            } catch (error) {
                logger.error({ error }, 'Failed to schedule payout');
                return reply.status(500).send({ error: 'Failed to schedule payout' });
            }
        }
    );

    /**
     * Create escrow hold
     */
    app.post(
        '/escrow/holds',
        async (
            request: FastifyRequest<{
                Body: {
                    placement_id: string;
                    hold_amount: number;
                    hold_reason: string;
                    release_date?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const hold = await payoutService.createEscrowHold(
                    request.body.placement_id,
                    request.body.hold_amount,
                    request.body.hold_reason,
                    request.body.release_date ? new Date(request.body.release_date) : undefined
                );

                return reply.status(201).send({ data: hold });
            } catch (error) {
                logger.error({ error }, 'Failed to create escrow hold');
                return reply.status(500).send({ error: 'Failed to create escrow hold' });
            }
        }
    );

    /**
     * Release escrow hold
     */
    app.post(
        '/escrow/holds/:id/release',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const hold = await payoutService.releaseEscrowHold(
                    request.params.id,
                    'admin' // TODO: Get from auth context
                );

                return reply.send({ data: hold });
            } catch (error) {
                logger.error({ error }, 'Failed to release escrow hold');
                return reply.status(500).send({ error: 'Failed to release escrow hold' });
            }
        }
    );
}
