// Domain events for RabbitMQ

export interface DomainEvent {
    event_id: string;
    event_type: string;
    timestamp: string;
    source_service: string;
    payload: Record<string, any>;
}

// Application events
export interface ApplicationCreatedEvent extends DomainEvent {
    event_type: 'application.created';
    payload: {
        application_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id?: string;
    };
}

export interface ApplicationStageChangedEvent extends DomainEvent {
    event_type: 'application.stage_changed';
    payload: {
        application_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id?: string;
        old_stage: string;
        new_stage: string;
    };
}

// Placement events
export interface PlacementCreatedEvent extends DomainEvent {
    event_type: 'placement.created';
    payload: {
        placement_id: string;
        job_id: string;
        candidate_id: string;
        company_id: string;
        recruiter_id: string;
        salary: number;
        fee_amount: number;
        recruiter_share: number;
    };
}

// Subscription events
export interface SubscriptionActivatedEvent extends DomainEvent {
    event_type: 'subscription.activated';
    payload: {
        subscription_id: string;
        recruiter_id: string;
        plan_id: string;
    };
}

export interface SubscriptionCanceledEvent extends DomainEvent {
    event_type: 'subscription.canceled';
    payload: {
        subscription_id: string;
        recruiter_id: string;
        plan_id: string;
    };
}

// ============================================================================
// Phase 2 Domain Events
// ============================================================================

// Candidate Sourcing Events
export interface CandidateSourcedEvent extends DomainEvent {
    event_type: 'candidate.sourced';
    payload: {
        candidate_id: string;
        sourcer_user_id: string;
        sourcer_type: 'recruiter' | 'tsn';
        protection_expires_at: string;
    };
}

export interface CandidateOutreachSentEvent extends DomainEvent {
    event_type: 'candidate.outreach_sent';
    payload: {
        outreach_id: string;
        candidate_id: string;
        recruiter_user_id: string;
        job_id?: string;
    };
}

// Candidate-Role Assignment Events
export interface ProposalCreatedEvent extends DomainEvent {
    event_type: 'proposal.created';
    payload: {
        assignment_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
        response_due_at: string;
    };
}

export interface ProposalAcceptedEvent extends DomainEvent {
    event_type: 'proposal.accepted';
    payload: {
        assignment_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
    };
}

export interface ProposalDeclinedEvent extends DomainEvent {
    event_type: 'proposal.declined';
    payload: {
        assignment_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
        reason?: string;
    };
}

export interface ProposalTimedOutEvent extends DomainEvent {
    event_type: 'proposal.timed_out';
    payload: {
        assignment_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
    };
}

// Placement Lifecycle Events
export interface PlacementStateChangedEvent extends DomainEvent {
    event_type: 'placement.state_changed';
    payload: {
        placement_id: string;
        old_state: string;
        new_state: string;
        job_id: string;
        candidate_id: string;
    };
}

export interface PlacementActivatedEvent extends DomainEvent {
    event_type: 'placement.activated';
    payload: {
        placement_id: string;
        job_id: string;
        candidate_id: string;
        start_date: string;
        guarantee_expires_at: string;
    };
}

export interface PlacementCompletedEvent extends DomainEvent {
    event_type: 'placement.completed';
    payload: {
        placement_id: string;
        job_id: string;
        candidate_id: string;
        end_date: string;
        collaborators: Array<{
            recruiter_user_id: string;
            role: string;
            split_amount: number;
        }>;
    };
}

export interface PlacementFailedEvent extends DomainEvent {
    event_type: 'placement.failed';
    payload: {
        placement_id: string;
        job_id: string;
        candidate_id: string;
        failure_reason?: string;
        within_guarantee: boolean;
    };
}

export interface ReplacementRequestedEvent extends DomainEvent {
    event_type: 'placement.replacement_requested';
    payload: {
        failed_placement_id: string;
        job_id: string;
        candidate_id: string;
        recruiter_id: string;
    };
}

// Collaboration Events
export interface CollaborationInvitedEvent extends DomainEvent {
    event_type: 'collaboration.invited';
    payload: {
        placement_id: string;
        inviting_recruiter_id: string;
        invited_recruiter_id: string;
        proposed_role: string;
        proposed_split_percentage: number;
    };
}

export interface CollaborationAcceptedEvent extends DomainEvent {
    event_type: 'collaboration.accepted';
    payload: {
        placement_id: string;
        recruiter_user_id: string;
        role: string;
        split_percentage: number;
    };
}

// Reputation Events
export interface ReputationUpdatedEvent extends DomainEvent {
    event_type: 'reputation.updated';
    payload: {
        recruiter_id: string;
        old_score: number;
        new_score: number;
        reason: string;
    };
}

export type AnyDomainEvent =
    | ApplicationCreatedEvent
    | ApplicationStageChangedEvent
    | PlacementCreatedEvent
    | SubscriptionActivatedEvent
    | SubscriptionCanceledEvent
    // Phase 2 events
    | CandidateSourcedEvent
    | CandidateOutreachSentEvent
    | ProposalCreatedEvent
    | ProposalAcceptedEvent
    | ProposalDeclinedEvent
    | ProposalTimedOutEvent
    | PlacementStateChangedEvent
    | PlacementActivatedEvent
    | PlacementCompletedEvent
    | PlacementFailedEvent
    | ReplacementRequestedEvent
    | CollaborationInvitedEvent
    | CollaborationAcceptedEvent
    | ReputationUpdatedEvent;

