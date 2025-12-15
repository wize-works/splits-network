import { FastifyInstance } from 'fastify';
import { WebhookSigner, WEBHOOK_EVENTS, WebhookSubscription, WebhookEvent } from './webhooks';
import type { Logger } from '@splits-network/shared-logging';

interface CreateWebhookRequest {
    url: string;
    events: WebhookEvent[];
    description?: string;
}

interface UpdateWebhookRequest {
    url?: string;
    events?: WebhookEvent[];
    active?: boolean;
    description?: string;
}

/**
 * Register webhook management routes
 */
export function registerWebhookRoutes(app: FastifyInstance, logger: Logger) {
    /**
     * List all webhooks for current user/organization
     */
    app.get('/api/v1/webhooks', {
        schema: {
            description: 'List all webhook subscriptions',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // In production, fetch from database
        // For now, return empty array
        logger.info({ userId }, 'Listing webhooks');

        return reply.send({
            webhooks: [],
        });
    });

    /**
     * Create new webhook subscription
     */
    app.post<{ Body: CreateWebhookRequest }>('/api/v1/webhooks', {
        schema: {
            description: 'Create a new webhook subscription',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
            body: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'HTTPS URL to receive webhook events',
                    },
                    events: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: Object.values(WEBHOOK_EVENTS),
                        },
                        minItems: 1,
                        description: 'List of events to subscribe to',
                    },
                    description: {
                        type: 'string',
                        description: 'Optional description of webhook purpose',
                    },
                },
            },
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { url, events, description } = request.body;

        // Validate URL is HTTPS
        if (!url.startsWith('https://')) {
            return reply.status(400).send({
                error: 'Invalid URL',
                message: 'Webhook URL must use HTTPS',
            });
        }

        // Generate webhook secret
        const secret = WebhookSigner.generateSecret();

        // In production, save to database
        const webhook: Partial<WebhookSubscription> = {
            id: `wh_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            url,
            events,
            secret,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        logger.info({
            userId,
            webhookId: webhook.id,
            events,
        }, 'Webhook created');

        return reply.status(201).send({
            ...webhook,
            description,
            createdAt: webhook.createdAt!.toISOString(),
        });
    });

    /**
     * Get webhook by ID
     */
    app.get<{ Params: { id: string } }>('/api/v1/webhooks/:id', {
        schema: {
            description: 'Get webhook subscription details',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        const { id } = request.params;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // In production, fetch from database
        logger.info({ userId, webhookId: id }, 'Fetching webhook');

        return reply.status(404).send({
            error: 'Not Found',
            message: 'Webhook not found',
        });
    });

    /**
     * Update webhook subscription
     */
    app.patch<{ Params: { id: string }; Body: UpdateWebhookRequest }>('/api/v1/webhooks/:id', {
        schema: {
            description: 'Update webhook subscription',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                    },
                    events: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: Object.values(WEBHOOK_EVENTS),
                        },
                    },
                    active: {
                        type: 'boolean',
                    },
                    description: {
                        type: 'string',
                    },
                },
            },
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        const { id } = request.params;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // In production, update in database
        logger.info({ userId, webhookId: id }, 'Updating webhook');

        return reply.status(404).send({
            error: 'Not Found',
            message: 'Webhook not found',
        });
    });

    /**
     * Delete webhook subscription
     */
    app.delete<{ Params: { id: string } }>('/api/v1/webhooks/:id', {
        schema: {
            description: 'Delete webhook subscription',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        const { id } = request.params;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // In production, delete from database
        logger.info({ userId, webhookId: id }, 'Deleting webhook');

        return reply.status(404).send({
            error: 'Not Found',
            message: 'Webhook not found',
        });
    });

    /**
     * Rotate webhook secret
     */
    app.post<{ Params: { id: string } }>('/api/v1/webhooks/:id/rotate-secret', {
        schema: {
            description: 'Rotate webhook signing secret',
            tags: ['webhooks'],
            security: [{ oauthToken: [] }, { clerkAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const userId = (request as any).auth?.userId;
        const { id } = request.params;
        
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        // Generate new secret
        const newSecret = WebhookSigner.generateSecret();

        // In production, update in database
        logger.info({ userId, webhookId: id }, 'Rotating webhook secret');

        return reply.send({
            secret: newSecret,
            rotatedAt: new Date().toISOString(),
        });
    });

    /**
     * List webhook deliveries (history)
     */
    app.get<{ Params: { id: string }; Querystring: { limit?: number; offset?: number } }>(
        '/api/v1/webhooks/:id/deliveries',
        {
            schema: {
                description: 'List webhook delivery history',
                tags: ['webhooks'],
                security: [{ oauthToken: [] }, { clerkAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                    },
                },
                querystring: {
                    type: 'object',
                    properties: {
                        limit: { type: 'number', default: 50, maximum: 100 },
                        offset: { type: 'number', default: 0 },
                    },
                },
            },
        },
        async (request, reply) => {
            const userId = (request as any).auth?.userId;
            const { id } = request.params;
            const { limit = 50, offset = 0 } = request.query;
            
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            // In production, fetch from database
            logger.info({ userId, webhookId: id, limit, offset }, 'Listing webhook deliveries');

            return reply.send({
                deliveries: [],
                total: 0,
            });
        }
    );

    /**
     * Retry failed webhook delivery
     */
    app.post<{ Params: { id: string; deliveryId: string } }>(
        '/api/v1/webhooks/:id/deliveries/:deliveryId/retry',
        {
            schema: {
                description: 'Retry a failed webhook delivery',
                tags: ['webhooks'],
                security: [{ oauthToken: [] }, { clerkAuth: [] }],
                params: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        deliveryId: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const userId = (request as any).auth?.userId;
            const { id, deliveryId } = request.params;
            
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            // In production, queue retry
            logger.info({ userId, webhookId: id, deliveryId }, 'Retrying webhook delivery');

            return reply.status(202).send({
                message: 'Webhook delivery queued for retry',
            });
        }
    );

    /**
     * List available webhook events
     */
    app.get('/api/v1/webhooks/events', {
        schema: {
            description: 'List all available webhook event types',
            tags: ['webhooks'],
        },
    }, async (request, reply) => {
        const events = Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
            name: value,
            description: key.toLowerCase().replace(/_/g, ' '),
        }));

        return reply.send({ events });
    });
}
