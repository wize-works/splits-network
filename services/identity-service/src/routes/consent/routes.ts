/**
 * User Consent Routes
 * API endpoints for managing cookie and privacy consent
 */

import { FastifyInstance } from 'fastify';
import { ConsentService } from '../../services/consent/service';

export function registerConsentRoutes(
    app: FastifyInstance,
    service: ConsentService
) {
    /**
     * GET /consent
     * Get current user's consent preferences
     */
    app.get('/consent', async (request, reply) => {
        try {
            const userId = (request as any).userId;
            
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const consent = await service.getConsent(userId);
            
            if (!consent) {
                return reply.status(404).send({ error: 'No consent record found' });
            }

            return reply.send(consent);
        } catch (error: any) {
            request.log.error(error, 'Error fetching consent');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * POST /consent
     * Save or update user's consent preferences
     */
    app.post<{
        Body: {
            preferences: {
                functional: boolean;
                analytics: boolean;
                marketing: boolean;
            };
        };
    }>('/consent', async (request, reply) => {
        try {
            const userId = (request as any).userId;
            
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            const { preferences } = request.body;

            if (!preferences || typeof preferences !== 'object') {
                return reply.status(400).send({ error: 'Invalid request body' });
            }

            // Extract IP and user agent for audit trail
            const ip_address = request.headers['x-forwarded-for'] as string || request.ip;
            const user_agent = request.headers['user-agent'];

            const consent = await service.saveConsent(userId, {
                preferences: {
                    necessary: true,
                    functional: preferences.functional ?? false,
                    analytics: preferences.analytics ?? false,
                    marketing: preferences.marketing ?? false,
                },
                ip_address,
                user_agent,
                consent_source: 'web',
            });

            return reply.status(201).send(consent);
        } catch (error: any) {
            request.log.error(error, 'Error saving consent');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    /**
     * DELETE /consent
     * Delete user's consent record (GDPR right to be forgotten)
     */
    app.delete('/consent', async (request, reply) => {
        try {
            const userId = (request as any).userId;
            
            if (!userId) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            await service.deleteConsent(userId);

            return reply.status(204).send();
        } catch (error: any) {
            request.log.error(error, 'Error deleting consent');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
