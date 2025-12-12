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

export type AnyDomainEvent =
    | ApplicationCreatedEvent
    | ApplicationStageChangedEvent
    | PlacementCreatedEvent
    | SubscriptionActivatedEvent
    | SubscriptionCanceledEvent;
