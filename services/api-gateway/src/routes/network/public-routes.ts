import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';

/**
 * Network Service Public Routes
 * - Invitation consent endpoints (unauthenticated)
 * These endpoints are called by the candidate website without authentication
 */
export function registerNetworkPublicRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const networkService = () => services.get('network');

    // Get invitation details by token (public)
    app.get('/api/network/recruiter-candidates/invitation/:token', {
        schema: {
            description: 'Get invitation details by token (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.params as { token: string };
        const data = await networkService().get(`/recruiter-candidates/invitation/${token}`);
        return reply.send(data);
    });

    // Accept invitation (public)
    app.post('/api/network/recruiter-candidates/invitation/:token/accept', {
        schema: {
            description: 'Accept recruiter invitation (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.params as { token: string };
        const data = await networkService().post(
            `/recruiter-candidates/invitation/${token}/accept`,
            request.body
        );
        return reply.send(data);
    });

    // Decline invitation (public)
    app.post('/api/network/recruiter-candidates/invitation/:token/decline', {
        schema: {
            description: 'Decline recruiter invitation (public)',
            tags: ['network-public'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.params as { token: string };
        const data = await networkService().post(
            `/recruiter-candidates/invitation/${token}/decline`,
            request.body
        );
        return reply.send(data);
    });

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
