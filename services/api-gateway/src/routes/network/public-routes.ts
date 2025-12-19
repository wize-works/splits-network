import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';

/**
 * Network Service Public Routes
 * - Public endpoints for viewing recruiter/candidate/user details
 * These endpoints are called by the candidate website without authentication
 * Note: Invitation accept/decline endpoints are now authenticated
 */
export function registerNetworkPublicRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const networkService = () => services.get('network');

    // Get recruiter details (public - for invitation page)
    app.get('/api/network/recruiters/:id', {
        schema: {
            description: 'Get recruiter details (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await networkService().get(`/recruiters/${id}`);
        return reply.send(data);
    });

    // Get candidate details (public - for invitation page)
    app.get('/api/ats/candidates/:id', {
        schema: {
            description: 'Get candidate details (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/candidates/${id}`);
        return reply.send(data);
    });

    // Get user details (public - for invitation page)
    app.get('/api/identity/users/:id', {
        schema: {
            description: 'Get user details (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const identityService = services.get('identity');
        const data = await identityService.get(`/users/${id}`);
        return reply.send(data);
    });
}
