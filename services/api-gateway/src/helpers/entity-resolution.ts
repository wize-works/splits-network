import { ServiceRegistry } from '../clients';

/**
 * Entity Resolution Helper
 * 
 * Resolves Clerk user IDs to appropriate entity IDs based on user role.
 * This ensures consistent behavior across all API Gateway routes.
 * 
 * Pattern:
 * - Recruiters: Clerk userId → network.recruiters.id (recruiter_id)
 * - Companies: Clerk userId → identity.organizations.id (company_id) [future]
 * - Candidates: Clerk userId → identity.users.id (stays as userId)
 * - Admins: Clerk userId → identity.users.id (stays as userId)
 */

export interface ResolvedEntity {
    entityId: string;
    isInactive?: boolean;
}

/**
 * Resolve entity ID for user based on their role
 * 
 * @param userId - Clerk user ID
 * @param userRole - User's primary role (recruiter, company, candidate, admin)
 * @param services - Service registry for calling downstream services
 * @param correlationId - Request correlation ID for tracing
 * @returns Resolved entity ID and inactive status
 * 
 * @example
 * // For recruiter user
 * const { entityId, isInactive } = await resolveEntityId(
 *   '41a7e453-e648-4368-aab0-1ee48eedf5b9', // Clerk userId
 *   'recruiter',
 *   services,
 *   correlationId
 * );
 * // Returns: { entityId: '11ce3517-2925-4f62-8de2-3dceec3ec1f2' } (recruiter_id from network.recruiters)
 */
export async function resolveEntityId(
    userId: string,
    userRole: string,
    services: ServiceRegistry,
    correlationId: string
): Promise<ResolvedEntity> {
    // For recruiters: resolve to recruiter_id from network.recruiters table
    if (userRole === 'recruiter') {
        try {
            const networkService = services.get('network');
            const recruiterResponse: any = await networkService.get(
                `/recruiters/by-user/${userId}`,
                undefined,
                correlationId
            );

            if (recruiterResponse.data && recruiterResponse.data.status === 'active') {
                return { entityId: recruiterResponse.data.id }; // Use recruiter_id
            } else {
                return { entityId: userId, isInactive: true }; // Inactive recruiter
            }
        } catch (error) {
            throw new Error('Failed to verify recruiter status');
        }
    }

    // For companies: future - resolve to company_id from identity.organizations
    // if (userRole === 'company') {
    //     const identityService = services.get('identity');
    //     const orgResponse = await identityService.get(`/organizations/by-user/${userId}`, ...);
    //     return { entityId: orgResponse.data.id };
    // }

    // For candidates and admins: use userId directly
    return { entityId: userId };
}

/**
 * Determine user role based on Clerk memberships
 * 
 * Priority order: platform_admin > company_admin/hiring_manager > recruiter > candidate
 */
export function determineUserRole(auth: any): string {
    const memberships = auth.memberships || [];
    
    if (memberships.some((m: any) => m.role === 'platform_admin')) {
        return 'admin';
    }
    if (memberships.some((m: any) => ['company_admin', 'hiring_manager'].includes(m.role))) {
        return 'company';
    }
    if (memberships.some((m: any) => m.role === 'recruiter')) {
        return 'recruiter';
    }
    
    return 'candidate'; // Default
}
