import { FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { UnauthorizedError, ForbiddenError } from '@splits-network/shared-fastify';

export type UserRole = 'candidate' | 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin';

export interface MembershipContext {
    id: string;
    organization_id: string;
    organization_name: string;
    role: UserRole;
}

export interface AuthContext {
    userId: string;
    clerkUserId: string;
    email: string;
    name: string;
    memberships: MembershipContext[];
}

export class AuthMiddleware {
    private clerkClient;
    private secretKey: string;

    constructor(clerkSecretKey: string) {
        this.secretKey = clerkSecretKey;
        this.clerkClient = createClerkClient({ secretKey: clerkSecretKey });
    }

    async verifyToken(request: FastifyRequest): Promise<AuthContext> {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);

        try {
            // Verify the token with Clerk using the standalone verifyToken function
            const verified = await verifyToken(token, {
                secretKey: this.secretKey,
            });

            if (!verified || !verified.sub) {
                throw new UnauthorizedError('Invalid token');
            }

            // Get user details from Clerk
            const user = await this.clerkClient.users.getUser(verified.sub);

            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            return {
                userId: '', // Will be filled by identity service
                clerkUserId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
                memberships: [], // Will be filled when resolving user context
            };
        } catch (error: any) {
            request.log.error({
                err: error,
                message: error?.message,
                stack: error?.stack,
                details: error
            }, 'Token verification failed');
            throw new UnauthorizedError('Token verification failed');
        }
    }

    createMiddleware() {
        return async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const authContext = await this.verifyToken(request);
                // Attach to request for downstream use
                (request as any).auth = authContext;
            } catch (error) {
                throw error;
            }
        };
    }
}
