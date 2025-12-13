import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '@splits-network/shared-fastify';
import { AuthContext, UserRole } from './auth';

export interface AuthenticatedRequest extends FastifyRequest {
    auth: AuthContext;
}

/**
 * RBAC middleware factory
 * Checks if the authenticated user has at least one of the required roles
 */
export function requireRoles(allowedRoles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;

        if (!req.auth) {
            throw new UnauthorizedError('Authentication required');
        }

        if (!req.auth.memberships || req.auth.memberships.length === 0) {
            throw new ForbiddenError('No organization memberships found. Please contact an administrator.');
        }

        // Check if user has any of the allowed roles across their memberships
        const userRoles = req.auth.memberships.map(m => m.role);
        const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasAllowedRole) {
            request.log.warn({
                userId: req.auth.userId,
                userRoles,
                requiredRoles: allowedRoles,
                path: request.url,
            }, 'Access denied: insufficient permissions');

            throw new ForbiddenError(
                `Access denied. Required roles: ${allowedRoles.join(' or ')}. Your roles: ${userRoles.join(', ')}`
            );
        }
    };
}

/**
 * Check if user has a specific role
 */
export function hasRole(auth: AuthContext, role: UserRole): boolean {
    return auth.memberships.some(m => m.role === role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(auth: AuthContext, roles: UserRole[]): boolean {
    return auth.memberships.some(m => roles.includes(m.role));
}

/**
 * Check if user is a platform admin
 */
export function isAdmin(auth: AuthContext): boolean {
    return hasRole(auth, 'platform_admin');
}

/**
 * Check if user is a recruiter
 */
export function isRecruiter(auth: AuthContext): boolean {
    return hasRole(auth, 'recruiter');
}

/**
 * Check if user is a company user (admin or hiring manager)
 */
export function isCompanyUser(auth: AuthContext): boolean {
    return hasAnyRole(auth, ['company_admin', 'hiring_manager']);
}

/**
 * Get user's organization IDs
 */
export function getUserOrganizationIds(auth: AuthContext): string[] {
    return auth.memberships.map(m => m.organization_id);
}

/**
 * Check if user belongs to a specific organization
 */
export function belongsToOrganization(auth: AuthContext, organizationId: string): boolean {
    return auth.memberships.some(m => m.organization_id === organizationId);
}
