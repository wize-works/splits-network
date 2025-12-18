import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';

/**
 * Jobs Public Routes
 * - Public job listings for candidate website (unauthenticated)
 */
export function registerJobsPublicRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const atsService = () => services.get('ats');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // List all active jobs (public)
    app.get('/api/public/jobs', {
        schema: {
            description: 'List all active jobs (public, no auth required)',
            tags: ['jobs-public'],
            querystring: {
                type: 'object',
                properties: {
                    search: { type: 'string' },
                    location: { type: 'string' },
                    employment_type: { type: 'string' },
                    limit: { type: 'string' },
                    offset: { type: 'string' },
                }
            }
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);
        // Force status=active for public listing
        const params = new URLSearchParams(request.query as any);
        params.set('status', 'active');
        const path = `/jobs?${params.toString()}`;
        const data = await atsService().get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get job by ID (public)
    app.get('/api/public/jobs/:id', {
        schema: {
            description: 'Get job details by ID (public, no auth required)',
            tags: ['jobs-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const correlationId = getCorrelationId(request);
        const data = await atsService().get(`/jobs/${id}`, undefined, correlationId);
        return reply.send(data);
    });
}
