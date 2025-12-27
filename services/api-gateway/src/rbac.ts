import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '@splits-network/shared-fastify';
import { AuthContext, UserRole } from './auth';
import { ServiceRegistry } from './clients';

export interface AuthenticatedRequest extends FastifyRequest {
    auth: AuthContext;
    matchedRole?: UserRole; // Role that granted access via requireRoles()
}

/**
 * RBAC middleware factory
 * Checks if the authenticated user has at least one of the required roles
 */
export function requireRoles(allowedRoles: UserRole[], services?: ServiceRegistry) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;

        if (!req.auth) {
            throw new UnauthorizedError('Authentication required');
        }

        // Check memberships first if they exist
        const userRoles = req.auth.memberships?.map(m => m.role) || [];
        const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
        
        if (hasAllowedRole) {
            // Store the first matching role for later use
            const matchedRole = allowedRoles.find(role => userRoles.includes(role));
            req.matchedRole = matchedRole;
            request.log.debug({ userId: req.auth.userId, role: userRoles, matchedRole }, 'Access granted via membership');
            return;
        }

        // Special case: 'recruiter' role requires checking network service
        // Recruiters can be independent contractors (no memberships) or affiliated with companies
        if (allowedRoles.includes('recruiter') && services) {
            try {
                const correlationId = (request as any).correlationId;
                const networkService = services.get('network');
                const recruiterResponse: any = await networkService.get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );

                if (recruiterResponse?.data && recruiterResponse.data.status === 'active') {
                    req.matchedRole = 'recruiter';
                    request.log.debug({ userId: req.auth.userId }, 'Access granted: active recruiter via network service');
                    return;
                }
            } catch (error) {
                request.log.debug({ error, userId: req.auth.userId }, 'User is not a recruiter in network service');
            }
        }

        // No matching role found
        // No matching role found
        request.log.warn({
            userId: req.auth.userId,
            userRoles,
            requiredRoles: allowedRoles,
            path: request.url,
        }, 'Access denied: insufficient permissions');

        const isDevelopment = process.env.NODE_ENV === 'development';
        const errorMessage = isDevelopment
            ? `Access denied. Required roles: ${allowedRoles.join(' or ')}. Your roles: ${userRoles.length > 0 ? userRoles.join(', ') : 'none'}`
            : 'Access denied: insufficient permissions';

        throw new ForbiddenError(errorMessage);
    };
}

/**
 * Check if user has a specific role
 */
export function hasRole(auth: AuthContext, role: UserRole): boolean {
    return auth.memberships?.some(m => m.role === role) || false;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(auth: AuthContext, roles: UserRole[]): boolean {
    return auth.memberships?.some(m => roles.includes(m.role)) || false;
}

/**
 * ROLE HELPER FUNCTIONS
 * Centralized role checking for all portal roles
 */

/**
 * Check if user is a platform admin
 */
export function isPlatformAdmin(auth: AuthContext): boolean {
    return hasRole(auth, 'platform_admin');
}

/**
 * @deprecated Use isPlatformAdmin() instead for clarity
 */
export function isAdmin(auth: AuthContext): boolean {
    return isPlatformAdmin(auth);
}

/**
 * Check if user is a company admin
 */
export function isCompanyAdmin(auth: AuthContext): boolean {
    return hasRole(auth, 'company_admin');
}

/**
 * Check if user is a hiring manager
 */
export function isHiringManager(auth: AuthContext): boolean {
    return hasRole(auth, 'hiring_manager');
}

/**
 * Check if user is a company user (admin or hiring manager)
 */
export function isCompanyUser(auth: AuthContext): boolean {
    return hasAnyRole(auth, ['company_admin', 'hiring_manager']);
}

/**
 * Check if user is a recruiter
 * Checks both memberships and network service (for independent recruiters)
 */
export async function isRecruiter(auth: AuthContext, services?: ServiceRegistry, correlationId?: string): Promise<boolean> {
    // Check memberships first (fast path)
    if (hasRole(auth, 'recruiter')) {
        return true;
    }

    // Check network service for independent recruiters or recruiters with other memberships
    if (services) {
        try {
            const networkService = services.get('network');
            const recruiterResponse: any = await networkService.get(
                `/recruiters/by-user/${auth.userId}`,
                undefined,
                correlationId
            );
            return recruiterResponse?.data?.status === 'active';
        } catch (error) {
            return false;
        }
    }

    return false;
}

/**
 * Get user's organization IDs
 */
export function getUserOrganizationIds(auth: AuthContext): string[] {
    return auth.memberships?.map(m => m.organization_id) || [];
}

/**
 * Check if user belongs to a specific organization
 */
export function belongsToOrganization(auth: AuthContext, organizationId: string): boolean {
    return auth.memberships?.some(m => m.organization_id === organizationId) || false;
}
