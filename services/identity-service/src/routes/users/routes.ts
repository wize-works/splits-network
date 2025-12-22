/**
 * Users Routes
 * API endpoints for user management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from '../../services/users/service';
import { NotFoundError, BadRequestError } from '@splits-network/shared-fastify';

interface SyncClerkUserBody {
    clerk_user_id: string;
    email: string;
    name: string;
}

interface UpdateUserProfileBody {
    name?: string;
}

interface ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
}

interface UpdateOnboardingBody {
    step: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface CompleteOnboardingBody {
    role: 'recruiter' | 'company_admin';
    profile?: {
        bio?: string;
        phone?: string;
        industries?: string[];
        specialties?: string[];
    };
    company?: {
        name: string;
        website?: string;
        industry?: string;
        size?: string;
    };
}

export function registerUsersRoutes(
    app: FastifyInstance,
    service: UsersService
) {
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

    // Update user profile
    app.patch(
        '/users/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserProfileBody }>, reply: FastifyReply) => {
            const { id } = request.params;
            const updates = request.body;

            // Validate that name is provided and is a string
            if (!updates.name || typeof updates.name !== 'string' || updates.name.trim().length === 0) {
                throw new BadRequestError('Name is required and must be a non-empty string');
            }

            try {
                const user = await service.updateUserProfile(id, { name: updates.name.trim() });
                return reply.send({ data: user });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('User', id);
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

    // Change password
    app.post(
        '/users/:id/change-password',
        async (request: FastifyRequest<{ Params: { id: string }; Body: ChangePasswordBody }>, reply: FastifyReply) => {
            const { id } = request.params;
            const { currentPassword, newPassword } = request.body;

            // Validate inputs
            if (!currentPassword || typeof currentPassword !== 'string') {
                throw new BadRequestError('Current password is required');
            }

            if (!newPassword || typeof newPassword !== 'string') {
                throw new BadRequestError('New password is required');
            }

            if (newPassword.length < 8) {
                throw new BadRequestError('New password must be at least 8 characters long');
            }

            try {
                await service.changeUserPassword(id, currentPassword, newPassword);
                return reply.send({
                    data: {
                        success: true,
                        message: 'Password changed successfully',
                    },
                });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('User', id);
                }
                if (error.message.includes('does not meet requirements')) {
                    throw new BadRequestError(error.message);
                }
                throw error;
            }
        }
    );

    // Update onboarding progress
    app.patch(
        '/users/:id/onboarding',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateOnboardingBody }>, reply: FastifyReply) => {
            const { id } = request.params;
            const { step, status } = request.body;

            // Validate step
            if (typeof step !== 'number' || step < 1 || step > 4) {
                throw new BadRequestError('Step must be a number between 1 and 4');
            }

            // Validate status if provided
            const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
            if (status && !validStatuses.includes(status)) {
                throw new BadRequestError(`Status must be one of: ${validStatuses.join(', ')}`);
            }

            try {
                const user = await service.updateOnboardingProgress(id, step, status);
                return reply.send({ data: user });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('User', id);
                }
                throw error;
            }
        }
    );

    // Complete onboarding wizard
    app.post(
        '/users/:id/complete-onboarding',
        async (request: FastifyRequest<{ Params: { id: string }; Body: CompleteOnboardingBody }>, reply: FastifyReply) => {
            const { id } = request.params;
            const { role, profile, company } = request.body;

            // Validate role
            if (!role || !['recruiter', 'company_admin'].includes(role)) {
                throw new BadRequestError('Role must be either "recruiter" or "company_admin"');
            }

            // Validate required data based on role
            if (role === 'company_admin' && (!company || !company.name)) {
                throw new BadRequestError('Company name is required for company admin role');
            }

            try {
                const data: any = {};
                if (role === 'recruiter' && profile) {
                    data.recruiter = profile;
                } else if (role === 'company_admin' && company) {
                    data.company = company;
                }

                const result = await service.completeOnboarding(id, role, data);
                return reply.send({ 
                    data: {
                        user: result.user,
                        organization_id: result.organizationId,
                        role
                    }
                });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('User', id);
                }
                if (error.message.includes('required')) {
                    throw new BadRequestError(error.message);
                }
                throw error;
            }
        }
    );
}
