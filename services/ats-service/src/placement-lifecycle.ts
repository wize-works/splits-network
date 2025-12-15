import { AtsRepository } from './repository';
import { EventPublisher } from './events';
import {
    Placement,
    PlacementState,
} from '@splits-network/shared-types';

/**
 * Phase 2: Placement Lifecycle Service
 * 
 * Manages the placement state machine: hired → active → completed or failed
 * Handles guarantees and replacements.
 */
export class PlacementLifecycleService {
    constructor(
        private repository: AtsRepository,
        private eventPublisher: EventPublisher
    ) {}

    /**
     * Transition a placement to a new state with validation.
     */
    async transitionPlacementState(
        placementId: string,
        newState: PlacementState,
        metadata?: {
            start_date?: Date;
            end_date?: Date;
            failure_reason?: string;
        }
    ): Promise<Placement> {
        const placement = await this.repository.findPlacementById(placementId);
        if (!placement) {
            throw new Error(`Placement ${placementId} not found`);
        }

        const currentState = placement.state || 'hired';
        this.validateStateTransition(currentState, newState);

        const updates: Partial<Placement> = {
            state: newState,
        };

        // State-specific updates
        if (newState === 'active' && metadata?.start_date) {
            updates.start_date = metadata.start_date;
            
            // Calculate guarantee expiry
            const guaranteeDays = placement.guarantee_days || 90;
            const guaranteeExpiresAt = new Date(metadata.start_date);
            guaranteeExpiresAt.setDate(guaranteeExpiresAt.getDate() + guaranteeDays);
            updates.guarantee_expires_at = guaranteeExpiresAt;
        }

        if (newState === 'completed' && metadata?.end_date) {
            updates.end_date = metadata.end_date;
        }

        if (newState === 'failed') {
            updates.failed_at = new Date();
            updates.failure_reason = metadata?.failure_reason;
        }

        const updated = await this.repository.updatePlacement(placementId, updates);

        // Publish event
        await this.eventPublisher.publish(
            'placement.state_changed',
            {
                placement_id: placementId,
                old_state: currentState,
                new_state: newState,
                job_id: placement.job_id,
                candidate_id: placement.candidate_id,
            },
            'ats-service'
        );

        // Publish specific events for certain transitions
        if (newState === 'active') {
            await this.eventPublisher.publish(
                'placement.activated',
                {
                    placement_id: placementId,
                    job_id: placement.job_id,
                    candidate_id: placement.candidate_id,
                    start_date: metadata?.start_date?.toISOString() || new Date().toISOString(),
                    guarantee_expires_at: updates.guarantee_expires_at?.toISOString() || '',
                },
                'ats-service'
            );
        }

        if (newState === 'completed') {
            // Get collaborators for completed event
            const collaborators = await this.repository.findPlacementCollaborators(placementId);
            
            await this.eventPublisher.publish(
                'placement.completed',
                {
                    placement_id: placementId,
                    job_id: placement.job_id,
                    candidate_id: placement.candidate_id,
                    end_date: metadata?.end_date?.toISOString() || new Date().toISOString(),
                    collaborators: collaborators.map(c => ({
                        recruiter_user_id: c.recruiter_user_id,
                        role: c.role,
                        split_amount: Number(c.split_amount),
                    })),
                },
                'ats-service'
            );
        }

        if (newState === 'failed') {
            const withinGuarantee = this.isWithinGuarantee(placement);
            
            await this.eventPublisher.publish(
                'placement.failed',
                {
                    placement_id: placementId,
                    job_id: placement.job_id,
                    candidate_id: placement.candidate_id,
                    failure_reason: metadata?.failure_reason,
                    within_guarantee: withinGuarantee,
                },
                'ats-service'
            );
        }

        return updated;
    }

    /**
     * Activate a placement (mark as actively working).
     */
    async activatePlacement(
        placementId: string,
        startDate: Date
    ): Promise<Placement> {
        return await this.transitionPlacementState(placementId, 'active', { start_date: startDate });
    }

    /**
     * Complete a placement successfully.
     */
    async completePlacement(
        placementId: string,
        endDate: Date
    ): Promise<Placement> {
        return await this.transitionPlacementState(placementId, 'completed', { end_date: endDate });
    }

    /**
     * Mark a placement as failed.
     */
    async failPlacement(
        placementId: string,
        failureReason?: string
    ): Promise<Placement> {
        return await this.transitionPlacementState(placementId, 'failed', { failure_reason: failureReason });
    }

    /**
     * Check if a placement is still within its guarantee period.
     */
    isWithinGuarantee(placement: Placement): boolean {
        if (!placement.guarantee_expires_at) {
            return false;
        }

        const expiresAt = new Date(placement.guarantee_expires_at);
        return expiresAt > new Date();
    }

    /**
     * Request a replacement for a failed placement.
     * The original recruiter must provide a replacement if within guarantee period.
     */
    async requestReplacement(
        failedPlacementId: string
    ): Promise<void> {
        const placement = await this.repository.findPlacementById(failedPlacementId);
        if (!placement) {
            throw new Error(`Placement ${failedPlacementId} not found`);
        }

        if (placement.state !== 'failed') {
            throw new Error('Can only request replacement for failed placements');
        }

        if (!this.isWithinGuarantee(placement)) {
            throw new Error('Placement is outside the guarantee period');
        }

        // Publish event for notification
        await this.eventPublisher.publish(
            'placement.replacement_requested',
            {
                failed_placement_id: failedPlacementId,
                job_id: placement.job_id,
                candidate_id: placement.candidate_id,
                recruiter_id: placement.recruiter_id,
            },
            'ats-service'
        );
    }

    /**
     * Link a new placement as a replacement for a failed one.
     */
    async linkReplacementPlacement(
        failedPlacementId: string,
        replacementPlacementId: string
    ): Promise<Placement> {
        const failedPlacement = await this.repository.findPlacementById(failedPlacementId);
        if (!failedPlacement) {
            throw new Error(`Failed placement ${failedPlacementId} not found`);
        }

        if (failedPlacement.state !== 'failed') {
            throw new Error('Original placement must be in failed state');
        }

        const replacementPlacement = await this.repository.findPlacementById(replacementPlacementId);
        if (!replacementPlacement) {
            throw new Error(`Replacement placement ${replacementPlacementId} not found`);
        }

        // Link the replacement
        return await this.repository.updatePlacement(replacementPlacementId, {
            replacement_placement_id: failedPlacementId,
        });
    }

    /**
     * Get all placements in a specific state.
     */
    async getPlacementsByState(state: PlacementState): Promise<Placement[]> {
        // Note: This would need a new repository method or filtering
        // For now, we'll fetch all and filter (not optimal for production)
        const allPlacements = await this.repository.findAllPlacements({});
        return allPlacements.filter(p => (p.state || 'hired') === state);
    }

    /**
     * Get placements with expiring guarantees (for alerting).
     */
    async getPlacementsWithExpiringGuarantees(daysUntilExpiry: number): Promise<Placement[]> {
        const allPlacements = await this.repository.findAllPlacements({});
        const now = new Date();
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);

        return allPlacements.filter(p => {
            if (!p.guarantee_expires_at) return false;
            if (p.state === 'completed' || p.state === 'failed') return false;

            const expiresAt = new Date(p.guarantee_expires_at);
            return expiresAt > now && expiresAt <= expiryThreshold;
        });
    }

    /**
     * Validate state transitions according to the state machine rules.
     */
    private validateStateTransition(currentState: PlacementState, newState: PlacementState): void {
        const validTransitions: Record<PlacementState, PlacementState[]> = {
            hired: ['active', 'failed'],
            active: ['completed', 'failed'],
            completed: [], // Terminal state
            failed: [], // Terminal state
        };

        const allowedStates = validTransitions[currentState] || [];
        if (!allowedStates.includes(newState)) {
            throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
        }
    }
}
