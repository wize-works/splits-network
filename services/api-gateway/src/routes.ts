import { FastifyInstance, FastifyRequest } from 'fastify';
import { ServiceRegistry } from './clients';
import { AuthContext } from './auth';
import { AuthenticatedRequest } from './rbac';

// Import domain route registration functions
import { registerIdentityRoutes } from './routes/identity/routes';
import { registerRolesRoutes } from './routes/roles/routes';
import { registerJobsRoutes } from './routes/jobs/routes';
import { registerCompaniesRoutes } from './routes/companies/routes';
import { registerCandidatesRoutes } from './routes/candidates/routes';
import { registerApplicationsRoutes } from './routes/applications/routes';
import { registerPlacementsRoutes } from './routes/placements/routes';
import { registerRecruitersRoutes } from './routes/recruiters/routes';
import { registerAssignmentsRoutes } from './routes/assignments/routes';
import { registerProposalsRoutes } from './routes/proposals/routes';
import { registerReputationRoutes } from './routes/reputation/routes';
import { registerBillingRoutes } from './routes/billing/routes';
import { registerDocumentsRoutes } from './routes/documents/routes';
import { registerDashboardsRoutes } from './routes/dashboards/routes';
import { registerAdminRoutes } from './routes/admin/routes';
import { registerNetworkPublicRoutes } from './routes/network/public-routes';

/**
 * Helper to resolve internal user ID and memberships from Clerk ID
 */
async function resolveUserContext(services: ServiceRegistry, auth: AuthContext, correlationId?: string): Promise<void> {
    const identityService = services.get('identity');

    // Sync the Clerk user (idempotent - creates if missing, updates if changed)
    const syncResponse: any = await identityService.post('/sync-clerk-user', {
        clerk_user_id: auth.clerkUserId,
        email: auth.email,
        name: auth.name,
    }, correlationId);

    const userId = syncResponse.data.id;

    // Get full user profile with memberships
    const profileResponse: any = await identityService.get(`/users/${userId}`, undefined, correlationId);

    // Update auth context with user ID and memberships
    auth.userId = userId;
    auth.memberships = profileResponse.data.memberships || [];
}

/**
 * Main route registry
 * Registers all domain-specific routes
 */
export function registerRoutes(app: FastifyInstance, services: ServiceRegistry) {
    // Middleware to resolve user context (userId + memberships) for all /api routes
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/api/')) {
            const req = request as AuthenticatedRequest;
            if (req.auth) {
                const correlationId = (request as any).correlationId;
                await resolveUserContext(services, req.auth, correlationId);
            }
        }
    });

    // Register all domain-specific routes
    registerNetworkPublicRoutes(app, services); // Public routes first (no auth required)
    registerIdentityRoutes(app, services);
    registerRolesRoutes(app, services);
    registerJobsRoutes(app, services);
    registerCompaniesRoutes(app, services);
    registerCandidatesRoutes(app, services);
    registerApplicationsRoutes(app, services);
    registerPlacementsRoutes(app, services);
    registerRecruitersRoutes(app, services);
    registerAssignmentsRoutes(app, services);
    registerProposalsRoutes(app, services);
    registerReputationRoutes(app, services);
    registerBillingRoutes(app, services);
    registerDocumentsRoutes(app, services);
    registerDashboardsRoutes(app, services);
    registerAdminRoutes(app, services);
}
