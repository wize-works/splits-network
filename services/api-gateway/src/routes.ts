import { FastifyInstance, FastifyRequest } from 'fastify';
import { ServiceRegistry } from './clients';
import { AuthContext } from './auth';
import { AuthenticatedRequest } from './rbac';

// Import domain route registration functions
import { registerIdentityRoutes } from './routes/identity/routes';
import { registerRolesRoutes } from './routes/roles/routes';
import { registerJobsRoutes } from './routes/jobs/routes';
import { registerJobsPublicRoutes } from './routes/jobs/public-routes';
import { registerCompaniesRoutes } from './routes/companies/routes';
import { registerCandidatesRoutes } from './routes/candidates/routes';
import { registerApplicationsRoutes } from './routes/applications/routes';
import { registerPlacementsRoutes } from './routes/placements/routes';
import { registerRecruitersRoutes } from './routes/recruiters/routes';
import { registerRecruiterCandidateRoutes } from './routes/recruiter-candidates/routes';
import { registerAssignmentsRoutes } from './routes/assignments/routes';
import { registerProposalsRoutes } from './routes/proposals/routes';
import { registerReputationRoutes } from './routes/reputation/routes';
import { registerBillingRoutes } from './routes/billing/routes';
import { registerDocumentsRoutes } from './routes/documents/routes';
import { registerDashboardsRoutes } from './routes/dashboards/routes';
import { registerAdminRoutes } from './routes/admin/routes';
import { registerNetworkPublicRoutes } from './routes/network/public-routes';

/**
 * User context cache
 * Cache user ID and memberships to avoid hitting identity service on every request
 * TTL: 5 minutes (300,000ms)
 */
interface CachedUserContext {
    userId: string;
    memberships: any[];
    expiresAt: number;
}

const userContextCache = new Map<string, CachedUserContext>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Helper to resolve internal user ID and memberships from Clerk ID
 * Uses in-memory cache to avoid hitting identity service on every request
 */
async function resolveUserContext(services: ServiceRegistry, auth: AuthContext, correlationId?: string): Promise<void> {
    // Check cache first
    const cached = userContextCache.get(auth.clerkUserId);
    if (cached && cached.expiresAt > Date.now()) {
        // Cache hit - use cached data
        auth.userId = cached.userId;
        auth.memberships = cached.memberships;
        return;
    }

    // Cache miss - fetch from identity service
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

    // Store in cache
    userContextCache.set(auth.clerkUserId, {
        userId: auth.userId,
        memberships: auth.memberships,
        expiresAt: Date.now() + CACHE_TTL,
    });
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
    registerJobsPublicRoutes(app, services); // Public jobs for candidate website
    registerIdentityRoutes(app, services);
    registerRolesRoutes(app, services);
    registerJobsRoutes(app, services);
    registerCompaniesRoutes(app, services);
    registerCandidatesRoutes(app, services);
    registerApplicationsRoutes(app, services);
    registerPlacementsRoutes(app, services);
    registerRecruitersRoutes(app, services);
    registerRecruiterCandidateRoutes(app, services);
    registerAssignmentsRoutes(app, services);
    registerProposalsRoutes(app, services);
    registerReputationRoutes(app, services);
    registerBillingRoutes(app, services);
    registerDocumentsRoutes(app, services);
    registerDashboardsRoutes(app, services);
    registerAdminRoutes(app, services);
}
