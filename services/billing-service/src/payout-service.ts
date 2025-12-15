import { BillingRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';
import {
    Payout,
    PayoutStatus,
    PayoutSchedule,
    PayoutSplit,
    EscrowHold,
    PayoutAuditLog,
} from '@splits-network/shared-types';
import Stripe from 'stripe';

export interface CreatePayoutRequest {
    placementId: string;
    recruiterId: string;
    placementFee: number;
    recruiterSharePercentage: number;
    payoutAmount: number;
    holdbackAmount?: number;
    createdBy?: string;
}

export interface PayoutSplitRequest {
    collaboratorRecruiterId: string;
    splitPercentage: number;
    splitAmount: number;
}

/**
 * Phase 3: Automated Payout Engine
 * 
 * Handles:
 * - Payout creation and scheduling
 * - Stripe Connect transfers
 * - Multi-recruiter splits
 * - Escrow/holdback management
 * - Immutable audit trail
 */
export class PayoutService {
    constructor(
        private repository: BillingRepository,
        private stripe: Stripe,
        private logger: Logger
    ) {}

    /**
     * Create a payout record (not yet processed)
     */
    async createPayout(request: CreatePayoutRequest): Promise<Payout> {
        this.logger.info(
            { placementId: request.placementId, recruiterId: request.recruiterId },
            'Creating payout'
        );

        // Validate
        if (request.payoutAmount <= 0) {
            throw new Error('Payout amount must be positive');
        }
        if (request.recruiterSharePercentage < 0 || request.recruiterSharePercentage > 100) {
            throw new Error('Invalid recruiter share percentage');
        }

        const payout = await this.repository.createPayout({
            placement_id: request.placementId,
            recruiter_id: request.recruiterId,
            placement_fee: request.placementFee,
            recruiter_share_percentage: request.recruiterSharePercentage,
            payout_amount: request.payoutAmount,
            holdback_amount: request.holdbackAmount || 0,
            status: 'pending',
            created_by: request.createdBy || 'system',
        });

        await this.logPayoutEvent(payout.id, 'created', undefined, 'pending', request.createdBy || 'system');

        return payout;
    }

    /**
     * Schedule a payout to be processed at a specific date
     */
    async schedulePayout(
        placementId: string,
        scheduledDate: Date,
        triggerEvent: string
    ): Promise<PayoutSchedule> {
        this.logger.info(
            { placementId, scheduledDate, triggerEvent },
            'Scheduling payout'
        );

        return this.repository.createPayoutSchedule({
            placement_id: placementId,
            scheduled_date: scheduledDate,
            trigger_event: triggerEvent,
            status: 'scheduled',
        });
    }

    /**
     * Process a payout via Stripe Connect
     */
    async processPayout(payoutId: string): Promise<Payout> {
        let payout = await this.repository.findPayoutById(payoutId);
        if (!payout) {
            throw new Error(`Payout ${payoutId} not found`);
        }

        if (payout.status !== 'pending' && payout.status !== 'failed') {
            throw new Error(`Payout ${payoutId} is not in processable state: ${payout.status}`);
        }

        this.logger.info({ payoutId, amount: payout.payout_amount }, 'Processing payout');

        try {
            // Update status to processing
            payout = await this.repository.updatePayoutStatus(payoutId, 'processing');
            await this.logPayoutEvent(payoutId, 'status_changed', payout.status, 'processing', 'system');

            // Get recruiter's Stripe Connect account
            const stripeAccountId = payout.stripe_connect_account_id;
            if (!stripeAccountId) {
                throw new Error(`Recruiter ${payout.recruiter_id} has no Stripe Connect account`);
            }

            // Create Stripe transfer
            const transfer = await this.stripe.transfers.create({
                amount: Math.round(payout.payout_amount * 100), // Convert to cents
                currency: 'usd',
                destination: stripeAccountId,
                metadata: {
                    payout_id: payoutId,
                    placement_id: payout.placement_id,
                    recruiter_id: payout.recruiter_id,
                },
            });

            this.logger.info(
                { payoutId, transferId: transfer.id },
                'Stripe transfer created'
            );

            // Update with Stripe details
            payout = await this.repository.updatePayout(payoutId, {
                stripe_transfer_id: transfer.id,
                status: 'completed',
                completed_at: new Date(),
            });

            await this.logPayoutEvent(
                payoutId,
                'stripe_transfer_created',
                'processing',
                'completed',
                'system',
                { stripe_transfer_id: transfer.id }
            );

            this.logger.info({ payoutId }, 'Payout completed successfully');

            return payout;
        } catch (error) {
            this.logger.error({ payoutId, error }, 'Payout processing failed');

            payout = await this.repository.updatePayout(payoutId, {
                status: 'failed',
                failed_at: new Date(),
                failure_reason: error instanceof Error ? error.message : 'Unknown error',
            });

            await this.logPayoutEvent(
                payoutId,
                'failed',
                'processing',
                'failed',
                'system',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );

            throw error;
        }
    }

    /**
     * Add splits for multi-recruiter placements
     */
    async addPayoutSplits(payoutId: string, splits: PayoutSplitRequest[]): Promise<PayoutSplit[]> {
        this.logger.info({ payoutId, splitCount: splits.length }, 'Adding payout splits');

        // Validate total doesn't exceed 100%
        const totalPercentage = splits.reduce((sum, s) => sum + s.splitPercentage, 0);
        if (totalPercentage > 100) {
            throw new Error(`Total split percentage ${totalPercentage}% exceeds 100%`);
        }

        const createdSplits: PayoutSplit[] = [];
        for (const split of splits) {
            const payoutSplit = await this.repository.createPayoutSplit({
                payout_id: payoutId,
                collaborator_recruiter_id: split.collaboratorRecruiterId,
                split_percentage: split.splitPercentage,
                split_amount: split.splitAmount,
                status: 'pending',
            });
            createdSplits.push(payoutSplit);
        }

        await this.logPayoutEvent(
            payoutId,
            'splits_added',
            undefined,
            undefined,
            'system',
            { split_count: splits.length }
        );

        return createdSplits;
    }

    /**
     * Create an escrow hold
     */
    async createEscrowHold(
        placementId: string,
        holdAmount: number,
        holdReason: string,
        releaseDate?: Date
    ): Promise<EscrowHold> {
        this.logger.info({ placementId, holdAmount, holdReason }, 'Creating escrow hold');

        return this.repository.createEscrowHold({
            placement_id: placementId,
            hold_amount: holdAmount,
            hold_reason: holdReason,
            held_at: new Date(),
            release_scheduled_date: releaseDate,
            status: 'active',
        });
    }

    /**
     * Release an escrow hold
     */
    async releaseEscrowHold(holdId: string, releasedBy: string): Promise<EscrowHold> {
        this.logger.info({ holdId, releasedBy }, 'Releasing escrow hold');

        const hold = await this.repository.updateEscrowHold(holdId, {
            status: 'released',
            released_at: new Date(),
            released_by: releasedBy,
        });

        // If hold is linked to a payout, release the holdback
        if (hold.payout_id) {
            await this.repository.updatePayout(hold.payout_id, {
                holdback_released_at: new Date(),
            });

            await this.logPayoutEvent(
                hold.payout_id,
                'holdback_released',
                undefined,
                undefined,
                releasedBy,
                { hold_id: holdId }
            );
        }

        return hold;
    }

    /**
     * Get payouts for a recruiter
     */
    async getRecruiterPayouts(recruiterId: string): Promise<Payout[]> {
        return this.repository.findPayoutsByRecruiterId(recruiterId);
    }

    /**
     * Get payouts for a placement
     */
    async getPlacementPayouts(placementId: string): Promise<Payout[]> {
        return this.repository.findPayoutsByPlacementId(placementId);
    }

    /**
     * Get payout audit trail
     */
    async getPayoutAuditLog(payoutId: string): Promise<PayoutAuditLog[]> {
        return this.repository.findPayoutAuditLog(payoutId);
    }

    /**
     * Process scheduled payouts (run daily via cron/job queue)
     */
    async processScheduledPayouts(): Promise<number> {
        this.logger.info('Processing scheduled payouts');

        const schedules = await this.repository.findScheduledPayoutsDue();
        let processedCount = 0;

        for (const schedule of schedules) {
            try {
                // Mark schedule as triggered
                await this.repository.updatePayoutSchedule(schedule.id, {
                    status: 'triggered',
                    triggered_at: new Date(),
                });

                // Get or create payout for this placement
                let payouts = await this.repository.findPayoutsByPlacementId(schedule.placement_id);
                
                if (payouts.length === 0) {
                    this.logger.warn(
                        { scheduleId: schedule.id, placementId: schedule.placement_id },
                        'No payout found for scheduled payout'
                    );
                    continue;
                }

                // Process all pending payouts for this placement
                for (const payout of payouts) {
                    if (payout.status === 'pending') {
                        await this.processPayout(payout.id);
                        processedCount++;
                    }
                }
            } catch (error) {
                this.logger.error(
                    { scheduleId: schedule.id, error },
                    'Failed to process scheduled payout'
                );
            }
        }

        this.logger.info({ processedCount }, 'Scheduled payouts processed');
        return processedCount;
    }

    /**
     * Log payout event to audit trail
     */
    private async logPayoutEvent(
        payoutId: string,
        eventType: string,
        oldStatus?: string,
        newStatus?: string,
        createdBy: string = 'system',
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.repository.createPayoutAuditLog({
            payout_id: payoutId,
            event_type: eventType,
            old_status: oldStatus,
            new_status: newStatus,
            reason: metadata?.reason,
            metadata,
            created_by: createdBy,
        });
    }
}
