import { FastifyInstance } from 'fastify';
import { NotificationRepository } from './repository';

/**
 * In-App Notification HTTP Routes
 * Direct HTTP endpoints for API Gateway to call
 */
export function registerInAppNotificationRoutes(
    fastify: FastifyInstance,
    repository: NotificationRepository
) {
    /**
     * GET /in-app-notifications/:clerkUserId - Get user's in-app notifications
     */
    fastify.get<{
        Params: { clerkUserId: string };
        Querystring: { unreadOnly?: string; limit?: string; offset?: string };
    }>('/in-app-notifications/:clerkUserId', async (request, reply) => {
        const { clerkUserId } = request.params;
        const { unreadOnly, limit, offset } = request.query;

        try {
            const notifications = await repository.findInAppNotificationsByUserId(clerkUserId, {
                unreadOnly: unreadOnly === 'true',
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
            });

            reply.send({ data: notifications });
        } catch (error: any) {
            fastify.log.error({ error, clerkUserId }, 'Failed to fetch in-app notifications');
            reply.code(500).send({
                error: {
                    code: 'FETCH_FAILED',
                    message: error.message || 'Failed to fetch notifications',
                },
            });
        }
    });

    /**
     * GET /in-app-notifications/:clerkUserId/unread-count - Get unread count
     */
    fastify.get<{
        Params: { clerkUserId: string };
    }>('/in-app-notifications/:clerkUserId/unread-count', async (request, reply) => {
        const { clerkUserId } = request.params;

        try {
            const count = await repository.getUnreadCount(clerkUserId);

            reply.send({ data: { count } });
        } catch (error: any) {
            fastify.log.error({ error, clerkUserId }, 'Failed to fetch unread count');
            reply.code(500).send({
                error: {
                    code: 'COUNT_FAILED',
                    message: error.message || 'Failed to fetch unread count',
                },
            });
        }
    });

    /**
     * PATCH /in-app-notifications/:id/read - Mark as read
     */
    fastify.patch<{
        Params: { id: string };
        Body: { clerkUserId: string };
    }>('/in-app-notifications/:id/read', async (request, reply) => {
        const { id } = request.params;
        const { clerkUserId } = request.body;

        if (!clerkUserId) {
            return reply.code(400).send({
                error: {
                    code: 'MISSING_USER_ID',
                    message: 'clerkUserId is required in request body',
                },
            });
        }

        try {
            const notification = await repository.markAsRead(id, clerkUserId);

            reply.send({ data: notification });
        } catch (error: any) {
            fastify.log.error({ error, notificationId: id, clerkUserId }, 'Failed to mark as read');
            reply.code(500).send({
                error: {
                    code: 'MARK_READ_FAILED',
                    message: error.message || 'Failed to mark as read',
                },
            });
        }
    });

    /**
     * PATCH /in-app-notifications/mark-all-read - Mark all as read
     */
    fastify.patch<{
        Body: { clerkUserId: string };
    }>('/in-app-notifications/mark-all-read', async (request, reply) => {
        const { clerkUserId } = request.body;

        if (!clerkUserId) {
            return reply.code(400).send({
                error: {
                    code: 'MISSING_USER_ID',
                    message: 'clerkUserId is required in request body',
                },
            });
        }

        try {
            await repository.markAllAsRead(clerkUserId);

            reply.send({ data: { success: true } });
        } catch (error: any) {
            fastify.log.error({ error, clerkUserId }, 'Failed to mark all as read');
            reply.code(500).send({
                error: {
                    code: 'MARK_ALL_READ_FAILED',
                    message: error.message || 'Failed to mark all as read',
                },
            });
        }
    });

    /**
     * PATCH /in-app-notifications/:id/dismiss - Dismiss notification
     */
    fastify.patch<{
        Params: { id: string };
        Body: { clerkUserId: string };
    }>('/in-app-notifications/:id/dismiss', async (request, reply) => {
        const { id } = request.params;
        const { clerkUserId } = request.body;

        if (!clerkUserId) {
            return reply.code(400).send({
                error: {
                    code: 'MISSING_USER_ID',
                    message: 'clerkUserId is required in request body',
                },
            });
        }

        try {
            const notification = await repository.dismissNotification(id, clerkUserId);

            reply.send({ data: notification });
        } catch (error: any) {
            fastify.log.error({ error, notificationId: id, clerkUserId }, 'Failed to dismiss notification');
            reply.code(500).send({
                error: {
                    code: 'DISMISS_FAILED',
                    message: error.message || 'Failed to dismiss notification',
                },
            });
        }
    });
}
