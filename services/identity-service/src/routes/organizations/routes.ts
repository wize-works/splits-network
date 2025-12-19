/**
 * Organizations Routes
 * API endpoints for organization management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OrganizationsService } from '../../services/organizations/service';
import { BadRequestError } from '@splits-network/shared-fastify';

interface CreateOrganizationBody {
    name: string;
    type: 'company' | 'platform';
}

export function registerOrganizationsRoutes(
    app: FastifyInstance,
    service: OrganizationsService
) {
    // Create organization
    app.post(
        '/organizations',
        async (request: FastifyRequest<{ Body: CreateOrganizationBody }>, reply: FastifyReply) => {
            const { name, type } = request.body;

            if (!name || !type) {
                throw new BadRequestError('Missing required fields');
            }

            const org = await service.createOrganization(name, type);
            return reply.status(201).send({ data: org });
        }
    );

    // Get organization memberships
    app.get(
        '/organizations/:organizationId/memberships',
        async (request: FastifyRequest<{ Params: { organizationId: string } }>, reply: FastifyReply) => {
            const memberships = await service.getOrganizationMemberships(request.params.organizationId);
            return reply.send({ data: memberships });
        }
    );
}
