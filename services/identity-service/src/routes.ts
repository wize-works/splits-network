import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IdentityService } from './service';
import { NotFoundError, BadRequestError } from '@splits-network/shared-fastify';

interface SyncClerkUserBody {
    clerk_user_id: string;
    email: string;
    name: string;
}

interface CreateOrganizationBody {
    name: string;
    type: 'company' | 'platform';
}

interface AddMembershipBody {
    user_id: string;
    organization_id: string;
    role: 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin';
}

export function registerRoutes(app: FastifyInstance, service: IdentityService) {
    // Get user profile by ID
    app.get(
        '/users/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const profile = await service.getUserProfile(request.params.id);
                return reply.send({ data: profile });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('User', request.params.id);
                }
                throw error;
            }
        }
    );

    // Sync Clerk user (internal endpoint)
    app.post(
        '/sync-clerk-user',
        async (request: FastifyRequest<{ Body: SyncClerkUserBody }>, reply: FastifyReply) => {
            const { clerk_user_id, email, name } = request.body;

            if (!clerk_user_id || !email || !name) {
                throw new BadRequestError('Missing required fields');
            }

            const user = await service.syncClerkUser(clerk_user_id, email, name);
            return reply.send({ data: user });
        }
    );

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

    // Add membership
    app.post(
        '/memberships',
        async (request: FastifyRequest<{ Body: AddMembershipBody }>, reply: FastifyReply) => {
            const { user_id, organization_id, role } = request.body;

            if (!user_id || !organization_id || !role) {
                throw new BadRequestError('Missing required fields');
            }

            const membership = await service.addMembership(user_id, organization_id, role);
            return reply.status(201).send({ data: membership });
        }
    );

    // Remove membership
    app.delete(
        '/memberships/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            await service.removeMembership(request.params.id);
            return reply.status(204).send();
        }
    );
}
