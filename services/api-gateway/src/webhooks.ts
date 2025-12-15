import { createHmac, randomBytes } from 'crypto';
import type { Logger } from '@splits-network/shared-logging';

/**
 * Webhook event types
 */
export const WEBHOOK_EVENTS = {
    // Role events
    ROLE_CREATED: 'role.created',
    ROLE_UPDATED: 'role.updated',
    ROLE_CLOSED: 'role.closed',
    
    // Application events
    APPLICATION_SUBMITTED: 'application.submitted',
    APPLICATION_STAGE_CHANGED: 'application.stage_changed',
    APPLICATION_WITHDRAWN: 'application.withdrawn',
    
    // Placement events
    PLACEMENT_CREATED: 'placement.created',
    PLACEMENT_CONFIRMED: 'placement.confirmed',
    PLACEMENT_CANCELLED: 'placement.cancelled',
    
    // Payout events
    PAYOUT_PROCESSED: 'payout.processed',
    PAYOUT_FAILED: 'payout.failed',
    
    // Team events (Phase 4)
    TEAM_MEMBER_ADDED: 'team.member_added',
    TEAM_MEMBER_REMOVED: 'team.member_removed',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, any>;
    id?: string; // Webhook delivery ID
}

/**
 * Webhook subscription configuration
 */
export interface WebhookSubscription {
    id: string;
    userId: string;
    organizationId?: string;
    url: string;
    events: WebhookEvent[];
    secret: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
    id: string;
    subscriptionId: string;
    event: WebhookEvent;
    payload: WebhookPayload;
    url: string;
    status: 'pending' | 'success' | 'failed' | 'retrying';
    attempts: number;
    lastAttemptAt?: Date;
    nextRetryAt?: Date;
    responseCode?: number;
    responseBody?: string;
    errorMessage?: string;
    createdAt: Date;
    completedAt?: Date;
}

/**
 * Webhook signature generator
 */
export class WebhookSigner {
    /**
     * Generate webhook signature using HMAC-SHA256
     */
    static sign(payload: string, secret: string): string {
        const hmac = createHmac('sha256', secret);
        hmac.update(payload);
        return hmac.digest('hex');
    }

    /**
     * Verify webhook signature
     */
    static verify(payload: string, signature: string, secret: string): boolean {
        const expectedSignature = this.sign(payload, secret);
        return signature === expectedSignature;
    }

    /**
     * Generate webhook secret
     */
    static generateSecret(): string {
        return `whsec_${randomBytes(32).toString('hex')}`;
    }

    /**
     * Create signature header value
     */
    static createSignatureHeader(payload: string, secret: string, timestamp: number): string {
        const signedPayload = `${timestamp}.${payload}`;
        const signature = this.sign(signedPayload, secret);
        return `t=${timestamp},v1=${signature}`;
    }
}

/**
 * Webhook delivery service
 */
export class WebhookDeliveryService {
    private logger: Logger;
    private maxRetries: number = 3;
    private retryDelays: number[] = [60, 300, 900]; // 1min, 5min, 15min

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Deliver webhook to endpoint
     */
    async deliver(
        subscription: WebhookSubscription,
        payload: WebhookPayload,
        attempt: number = 0
    ): Promise<WebhookDelivery> {
        const deliveryId = randomBytes(16).toString('hex');
        const delivery: WebhookDelivery = {
            id: deliveryId,
            subscriptionId: subscription.id,
            event: payload.event,
            payload,
            url: subscription.url,
            status: 'pending',
            attempts: attempt + 1,
            createdAt: new Date(),
        };

        try {
            // Prepare payload with ID
            const payloadWithId = { ...payload, id: deliveryId };
            const payloadString = JSON.stringify(payloadWithId);
            const timestamp = Math.floor(Date.now() / 1000);

            // Generate signature
            const signature = WebhookSigner.createSignatureHeader(
                payloadString,
                subscription.secret,
                timestamp
            );

            // Send webhook
            this.logger.info({
                deliveryId,
                subscriptionId: subscription.id,
                event: payload.event,
                url: subscription.url,
                attempt: attempt + 1,
            }, 'Delivering webhook');

            const response = await fetch(subscription.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': payload.event,
                    'X-Webhook-Delivery-ID': deliveryId,
                    'X-Webhook-Timestamp': timestamp.toString(),
                },
                body: payloadString,
            });

            delivery.lastAttemptAt = new Date();
            delivery.responseCode = response.status;
            
            // Consider 2xx as success
            if (response.status >= 200 && response.status < 300) {
                delivery.status = 'success';
                delivery.completedAt = new Date();
                
                this.logger.info({
                    deliveryId,
                    subscriptionId: subscription.id,
                    responseCode: response.status,
                }, 'Webhook delivered successfully');
            } else {
                // Non-2xx response
                const responseBody = await response.text();
                delivery.responseBody = responseBody;
                delivery.errorMessage = `HTTP ${response.status}: ${responseBody}`;
                
                // Determine if we should retry
                if (attempt < this.maxRetries) {
                    delivery.status = 'retrying';
                    delivery.nextRetryAt = new Date(
                        Date.now() + this.retryDelays[attempt] * 1000
                    );
                    
                    this.logger.warn({
                        deliveryId,
                        subscriptionId: subscription.id,
                        responseCode: response.status,
                        nextRetryAt: delivery.nextRetryAt,
                    }, 'Webhook delivery failed, will retry');
                } else {
                    delivery.status = 'failed';
                    delivery.completedAt = new Date();
                    
                    this.logger.error({
                        deliveryId,
                        subscriptionId: subscription.id,
                        responseCode: response.status,
                    }, 'Webhook delivery failed after max retries');
                }
            }

        } catch (error) {
            delivery.lastAttemptAt = new Date();
            delivery.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Network or other errors
            if (attempt < this.maxRetries) {
                delivery.status = 'retrying';
                delivery.nextRetryAt = new Date(
                    Date.now() + this.retryDelays[attempt] * 1000
                );
                
                this.logger.warn({
                    deliveryId,
                    subscriptionId: subscription.id,
                    error: delivery.errorMessage,
                    nextRetryAt: delivery.nextRetryAt,
                }, 'Webhook delivery error, will retry');
            } else {
                delivery.status = 'failed';
                delivery.completedAt = new Date();
                
                this.logger.error({
                    deliveryId,
                    subscriptionId: subscription.id,
                    error: delivery.errorMessage,
                }, 'Webhook delivery failed after max retries');
            }
        }

        return delivery;
    }

    /**
     * Queue webhook for delivery
     */
    async queue(subscription: WebhookSubscription, payload: WebhookPayload): Promise<void> {
        // In production, this would enqueue to RabbitMQ
        // For now, deliver immediately
        await this.deliver(subscription, payload);
    }

    /**
     * Retry failed webhook delivery
     */
    async retry(delivery: WebhookDelivery, subscription: WebhookSubscription): Promise<WebhookDelivery> {
        return this.deliver(subscription, delivery.payload, delivery.attempts);
    }
}

/**
 * Webhook event emitter
 */
export class WebhookEmitter {
    private deliveryService: WebhookDeliveryService;
    private logger: Logger;

    constructor(deliveryService: WebhookDeliveryService, logger: Logger) {
        this.deliveryService = deliveryService;
        this.logger = logger;
    }

    /**
     * Emit webhook event to all subscribed endpoints
     */
    async emit(
        event: WebhookEvent,
        data: Record<string, any>,
        subscriptions: WebhookSubscription[]
    ): Promise<void> {
        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };

        // Filter subscriptions that are active and subscribed to this event
        const relevantSubscriptions = subscriptions.filter(
            sub => sub.active && sub.events.includes(event)
        );

        this.logger.info({
            event,
            subscriptionCount: relevantSubscriptions.length,
        }, 'Emitting webhook event');

        // Queue deliveries (fire and forget)
        const deliveryPromises = relevantSubscriptions.map(sub =>
            this.deliveryService.queue(sub, payload).catch(err =>
                this.logger.error({ err, subscriptionId: sub.id }, 'Failed to queue webhook')
            )
        );

        // Don't wait for deliveries to complete
        Promise.all(deliveryPromises).catch(() => {
            // Errors already logged
        });
    }
}
