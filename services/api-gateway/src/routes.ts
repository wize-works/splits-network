import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from './clients';
import { AuthContext } from './auth';
import { requireRoles, AuthenticatedRequest, isRecruiter, isCompanyUser, isAdmin } from './rbac';

/**
 * API Gateway Routes with RBAC Enforcement
 * 
 * RBAC Data Scoping Rules:
 * 
 * 1. Platform Admins (platform_admin):
 *    - Full access to all data across all organizations
 *    - No filtering applied
 * 
 * 2. Company Users (company_admin, hiring_manager):
 *    - Can only view/manage data for their company's organization
 *    - Jobs: filtered by company_id matching their organization
 *    - Candidates: only those submitted to their company's jobs
 *    - Applications: only for their company's jobs
 *    - Placements: only for their company
 * 
 * 3. Recruiters (recruiter):
 *    - Can only view/manage jobs explicitly assigned to them
 *    - Jobs: filtered by role_assignments in network service
 *    - Candidates: only their own submissions
 *    - Applications: only for candidates they submitted
 *    - Placements: only where they are the recruiter of record
 * 
 * Use /api/roles endpoint (not /api/jobs) for properly filtered job listings.
 */

// Helper to get correlation ID from request
function getCorrelationId(request: FastifyRequest): string | undefined {
    return (request as any).correlationId;
}

// Helper to resolve internal user ID and memberships from Clerk ID
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

export function registerRoutes(app: FastifyInstance, services: ServiceRegistry) {
    // Middleware to resolve user context (userId + memberships) for all /api routes
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/api/')) {
            const req = request as AuthenticatedRequest;
            if (req.auth) {
                const correlationId = getCorrelationId(request);
                await resolveUserContext(services, req.auth, correlationId);
            }
        }
    });

    // Identity service routes
    app.get('/api/me', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const identityService = services.get('identity');
        const correlationId = getCorrelationId(request);

        // User context already resolved by middleware
        const profile = await identityService.get(`/users/${req.auth.userId}`, undefined, correlationId);
        return reply.send(profile);
    });

    // Roles endpoint - filtered by user role (RBAC enforced)
    // - platform_admin: sees all jobs
    // - company_admin/hiring_manager: sees only their company's jobs
    // - recruiter: sees only jobs assigned to them
    app.get('/api/roles', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const networkService = services.get('network');
        const identityService = services.get('identity');
        const correlationId = getCorrelationId(request);

        const isUserAdmin = isAdmin(req.auth);
        const isUserCompany = isCompanyUser(req.auth);
        const isUserRecruiter = isRecruiter(req.auth);

        // Build query params
        const queryParams = request.query as any;
        let jobIds: string[] | undefined;
        let companyIds: string[] | undefined;

        // Platform admins see everything - no filtering
        if (isUserAdmin) {
            // No filtering needed
        }
        // Company users (company_admin, hiring_manager) see only their company's jobs
        else if (isUserCompany) {
            // Get user's company organization(s)
            const companyMemberships = req.auth.memberships.filter(
                m => m.role === 'company_admin' || m.role === 'hiring_manager'
            );

            if (companyMemberships.length === 0) {
                return reply.send({ data: [] });
            }

            // Get company IDs for these organizations
            // In Phase 1, organization_id maps 1:1 to a company
            // Need to lookup companies by organization_id
            try {
                const companiesResponse: any = await atsService.get('/companies', undefined, correlationId);
                const allCompanies = companiesResponse.data || [];
                
                // Filter to companies that belong to user's organizations
                const orgIds = companyMemberships.map(m => m.organization_id);
                const userCompanyIds = allCompanies
                    .filter((c: any) => orgIds.includes(c.identity_organization_id))
                    .map((c: any) => c.id);

                if (userCompanyIds.length === 0) {
                    return reply.send({ data: [] });
                }

                companyIds = userCompanyIds;
            } catch (error) {
                request.log.error({ error, userId: req.auth.userId }, 'Failed to get company IDs for user');
                return reply.send({ data: [] });
            }
        }
        // Recruiters see only jobs assigned to them
        else if (isUserRecruiter) {
            // Get recruiter profile for this user
            try {
                const recruiterResponse: any = await networkService.get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );

                if (recruiterResponse.data) {
                    const recruiterId = recruiterResponse.data.id;

                    // Get job IDs assigned to this recruiter
                    const assignmentsResponse: any = await networkService.get(
                        `/recruiters/${recruiterId}/jobs`,
                        undefined,
                        correlationId
                    );

                    jobIds = assignmentsResponse.data || [];
                }
            } catch (error) {
                // If recruiter profile doesn't exist, return empty list
                return reply.send({ data: [] });
            }

            // If no assignments, return empty
            if (!jobIds || jobIds.length === 0) {
                return reply.send({ data: [] });
            }
        }
        // Unknown role - deny access
        else {
            return reply.status(403).send({ error: 'Insufficient permissions to view roles' });
        }

        // Get all jobs from ATS service
        const queryString = new URLSearchParams(queryParams).toString();
        const path = queryString ? `/jobs?${queryString}` : '/jobs';
        const jobsResponse: any = await atsService.get(path, undefined, correlationId);

        let jobs = jobsResponse.data || [];

        // Apply filtering based on role
        if (companyIds) {
            // Filter to only jobs from user's companies
            jobs = jobs.filter((job: any) => companyIds!.includes(job.company_id));
        } else if (jobIds) {
            // Filter to only assigned jobs for recruiters
            jobs = jobs.filter((job: any) => jobIds!.includes(job.id));
        }

        return reply.send({ data: jobs });
    });

    // ATS service routes - Jobs
    // Anyone authenticated can view jobs (unfiltered - use /api/roles for recruiter-filtered view)
    app.get('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs?${queryString}` : '/jobs';
        const data = await atsService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    app.get('/api/jobs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/jobs/${id}`, undefined, correlationId);
        return reply.send(data);
    });

    // Only company admins and platform admins can create jobs
    app.post('/api/jobs', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post('/jobs', request.body, correlationId);
        return reply.send(data);
    });

    // Only company admins and platform admins can update jobs
    app.patch('/api/jobs/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.patch(`/jobs/${id}`, request.body);
        return reply.send(data);
    });

    // ATS service routes - Applications    app.get('/api/applications', async (request: FastifyRequest, reply: FastifyReply) => {
    // ATS service routes - Applications
    app.get('/api/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/applications?${queryString}` : '/applications';
        const data = await atsService.get(path);
        return reply.send(data);
    });

    app.get('/api/applications/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/applications/${id}`);
        return reply.send(data);
    });

    // ATS service routes - Candidates
    app.get('/api/candidates', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/candidates?${queryString}` : '/candidates';
        const data = await atsService.get(path);
        return reply.send(data);
    });

    app.get('/api/candidates/sourcers', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/candidates/sourcers?${queryString}` : '/candidates/sourcers';
        const data = await atsService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    app.get('/api/candidates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/candidates/${id}`);
        return reply.send(data);
    });

    app.get('/api/candidates/:id/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/candidates/${id}/applications`);
        return reply.send(data);
    });

    // Only recruiters can submit applications
    app.post('/api/applications', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const data = await atsService.post('/applications', {
            ...(request.body as any),
            recruiter_id: req.auth.userId,
        });
        return reply.send(data);
    });

    // Company users and admins can change application stages
    app.patch('/api/applications/:id/stage', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.patch(`/applications/${id}/stage`, request.body);
        return reply.send(data);
    });

    app.get('/api/jobs/:jobId/applications', async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/jobs/${jobId}/applications`);
        return reply.send(data);
    });

    // ATS service routes - Placements
    // Recruiters and company users can view placements
    app.get('/api/placements', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/placements?${queryString}` : '/placements';
        const data = await atsService.get(path);
        return reply.send(data);
    });

    app.get('/api/placements/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/placements/${id}`);
        return reply.send(data);
    });

    // Only company admins and platform admins can create placements
    app.post('/api/placements', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/placements', request.body);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Candidate Ownership
    // ==========================================

    // Recruiters can source candidates
    app.post('/api/candidates/:id/source', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);

        // Get recruiter ID for this user
        const recruiterResponse: any = await networkService.get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        const data = await atsService.post(`/candidates/${id}/source`, {
            ...(request.body as any),
            recruiter_id: recruiterResponse.data.id,
        }, correlationId);
        return reply.send(data);
    });

    // Anyone can view candidate sourcer info
    app.get('/api/candidates/:id/sourcer', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/candidates/${id}/sourcer`, undefined, correlationId);
        return reply.send(data);
    });

    // Recruiters can record outreach
    app.post('/api/candidates/:id/outreach', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);

        // Get recruiter ID for this user
        const recruiterResponse: any = await networkService.get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        const data = await atsService.post(`/candidates/${id}/outreach`, {
            ...(request.body as any),
            recruiter_id: recruiterResponse.data.id,
        }, correlationId);
        return reply.send(data);
    });

    // Check candidate protection status
    app.get('/api/candidates/:id/protection-status', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/candidates/${id}/protection-status`, undefined, correlationId);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Placement Lifecycle
    // ==========================================

    // Company admins can activate placements
    app.post('/api/placements/:id/activate', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/activate`, request.body, correlationId);
        return reply.send(data);
    });

    // Company admins can complete placements
    app.post('/api/placements/:id/complete', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/complete`, request.body, correlationId);
        return reply.send(data);
    });

    // Company admins can mark placements as failed
    app.post('/api/placements/:id/fail', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/fail`, request.body, correlationId);
        return reply.send(data);
    });

    // Company admins can request replacements
    app.post('/api/placements/:id/request-replacement', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/request-replacement`, request.body, correlationId);
        return reply.send(data);
    });

    // Company admins can link replacement placements
    app.post('/api/placements/:id/link-replacement', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/link-replacement`, request.body, correlationId);
        return reply.send(data);
    });

    // View placement state history
    app.get('/api/placements/:id/state-history', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/placements/${id}/state-history`, undefined, correlationId);
        return reply.send(data);
    });

    // View guarantee details
    app.get('/api/placements/:id/guarantee', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/placements/:id/guarantee`, undefined, correlationId);
        return reply.send(data);
    });

    // Extend guarantee period
    app.post('/api/placements/:id/guarantee/extend', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/guarantee/extend`, request.body, correlationId);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Placement Collaboration
    // ==========================================

    // Recruiters can add collaborators
    app.post('/api/placements/:id/collaborators', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post(`/placements/${id}/collaborators`, request.body, correlationId);
        return reply.send(data);
    });

    // View placement collaborators
    app.get('/api/placements/:id/collaborators', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/placements/${id}/collaborators`, undefined, correlationId);
        return reply.send(data);
    });

    // Update collaborator split
    app.patch('/api/placements/:id/collaborators/:recruiter_id', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id, recruiter_id } = request.params as { id: string; recruiter_id: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.patch(`/placements/${id}/collaborators/${recruiter_id}`, request.body, correlationId);
        return reply.send(data);
    });

    // Calculate placement splits preview
    app.post('/api/placements/calculate-splits', async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.post('/placements/calculate-splits', request.body, correlationId);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Proposals
    // ==========================================

    // Recruiters can create proposals
    app.post('/api/proposals', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);

        // Get recruiter ID for this user
        const recruiterResponse: any = await networkService.get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );

        const data = await networkService.post('/proposals', {
            ...(request.body as any),
            recruiter_id: recruiterResponse.data.id,
        }, correlationId);
        return reply.send(data);
    });

    // Get my proposals (for the current recruiter or all proposals for company admins)
    app.get('/api/proposals/my-proposals', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);

        // Get user roles from memberships
        const userRoles = req.auth.memberships.map(m => m.role);

        // If user is a recruiter, get their proposals
        if (userRoles.includes('recruiter')) {
            // Get recruiter ID for this user
            const recruiterResponse: any = await networkService.get(
                `/recruiters/by-user/${req.auth.userId}`,
                undefined,
                correlationId
            );

            // Fetch proposals for this recruiter
            const data = await networkService.get(
                `/recruiters/${recruiterResponse.data.id}/proposals`,
                request.query as Record<string, any>,
                correlationId
            );
            return reply.send(data);
        } else {
            // Company admins/hiring managers/platform admins see all proposals
            // For now, return empty array - Phase 2 will implement company-wide proposal viewing
            return reply.send({ data: [] });
        }
    });

    // View proposal details
    app.get('/api/proposals/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.get(`/proposals/${id}`, undefined, correlationId);
        return reply.send(data);
    });

    // Company admins can accept proposals
    app.post('/api/proposals/:id/accept', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.post(`/proposals/${id}/accept`, request.body, correlationId);
        return reply.send(data);
    });

    // Company admins can decline proposals
    app.post('/api/proposals/:id/decline', {
        preHandler: requireRoles(['company_admin', 'hiring_manager', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.post(`/proposals/${id}/decline`, request.body, correlationId);
        return reply.send(data);
    });

    // Get proposals for a recruiter
    app.get('/api/recruiters/:id/proposals', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/recruiters/${id}/proposals?${queryString}` : `/recruiters/${id}/proposals`;
        const data = await networkService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get proposals for a job
    app.get('/api/jobs/:id/proposals', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/jobs/${id}/proposals?${queryString}` : `/jobs/${id}/proposals`;
        const data = await networkService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Process proposal timeouts (admin only)
    app.post('/api/proposals/process-timeouts', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.post('/proposals/process-timeouts', {}, correlationId);
        return reply.send(data);
    });

    // ==========================================
    // Phase 2 Routes - Reputation
    // ==========================================

    // Get recruiter reputation
    app.get('/api/recruiters/:id/reputation', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.get(`/recruiters/${id}/reputation`, undefined, correlationId);
        return reply.send(data);
    });

    // Recalculate recruiter reputation (admin only)
    app.post('/api/recruiters/:id/reputation/recalculate', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const data = await networkService.post(`/recruiters/${id}/reputation/recalculate`, {}, correlationId);
        return reply.send(data);
    });

    // Get reputation leaderboard
    app.get('/api/reputation/leaderboard', async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/reputation/leaderboard?${queryString}` : '/reputation/leaderboard';
        const data = await networkService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Get reputation history
    app.get('/api/recruiters/:id/reputation/history', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const correlationId = getCorrelationId(request);
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/recruiters/${id}/reputation/history?${queryString}` : `/recruiters/${id}/reputation/history`;
        const data = await networkService.get(path, undefined, correlationId);
        return reply.send(data);
    });

    // Network service routes - Recruiters
    // Platform admins can view all recruiters
    app.get('/api/recruiters', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.get('/recruiters');
        return reply.send(data);
    });

    // Anyone can view a specific recruiter profile
    app.get('/api/recruiters/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${id}`);
        return reply.send(data);
    });

    app.get('/api/recruiters/:id/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${id}/stats`);
        return reply.send(data);
    });

    // Users can create their own recruiter profile
    app.post('/api/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const data = await networkService.post('/recruiters', {
            ...(request.body as any),
            user_id: req.auth.userId,
        });
        return reply.send(data);
    });

    // Network service routes - Role assignments
    // Recruiters can view their assigned jobs
    app.get('/api/recruiters/:recruiterId/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/recruiters/${recruiterId}/jobs`);
        return reply.send(data);
    });

    // Get recruiters assigned to a specific job
    app.get('/api/jobs/:jobId/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId } = request.params as { jobId: string };
        const networkService = services.get('network');
        const data = await networkService.get(`/jobs/${jobId}/recruiters`);
        return reply.send(data);
    });

    // Only platform admins can assign recruiters to roles
    app.post('/api/assignments', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const data = await networkService.post('/assignments', request.body);
        return reply.send(data);
    });

    // Only platform admins can unassign recruiters from roles
    app.delete('/api/assignments/:jobId/:recruiterId', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { jobId, recruiterId } = request.params as { jobId: string; recruiterId: string };
        const networkService = services.get('network');
        // Network service expects query params, so we convert path params
        await networkService.delete(`/assignments?job_id=${jobId}&recruiter_id=${recruiterId}`);
        return reply.status(204).send();
    });

    // Billing service routes
    // Anyone authenticated can view plans
    app.get('/api/plans', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.get('/plans');
        return reply.send(data);
    });

    // Recruiters can view their own subscription, admins can view any
    app.get('/api/subscriptions/recruiter/:recruiterId', async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const { recruiterId } = request.params as { recruiterId: string };
        const billingService = services.get('billing');

        // TODO: Add check to ensure user can only view their own subscription unless admin
        const data = await billingService.get(`/subscriptions/recruiter/${recruiterId}`);
        return reply.send(data);
    });

    // Recruiters can create their own subscriptions
    app.post('/api/subscriptions', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const data = await billingService.post('/subscriptions', request.body);
        return reply.send(data);
    });

    // Companies - only company admins and platform admins can create companies
    // Platform admins can list all companies
    app.get('/api/companies', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get('/companies', undefined, correlationId);
        return reply.send(data);
    });

    // Get company by organization ID (for company admins to find their company)
    app.get('/api/companies/by-org/:orgId', async (request: FastifyRequest, reply: FastifyReply) => {
        const { orgId } = request.params as { orgId: string };
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);
        const data = await atsService.get(`/companies/by-org/${orgId}`, undefined, correlationId);
        return reply.send(data);
    });

    app.get('/api/companies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.get(`/companies/${id}`);
        return reply.send(data);
    });

    app.post('/api/companies', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const data = await atsService.post('/companies', request.body);
        return reply.send(data);
    });

    app.patch('/api/companies/:id', {
        preHandler: requireRoles(['company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const atsService = services.get('ats');
        const data = await atsService.patch(`/companies/${id}`, request.body);
        return reply.send(data);
    });

    // Document service routes
    // Upload document (authenticated users)
    app.post('/api/documents/upload', async (request: FastifyRequest, reply: FastifyReply) => {
        const documentService = services.get('document');
        // Note: Multipart handling will be done by document-service
        // Gateway just proxies the request
        const data = await documentService.post('/documents/upload', request.body);
        return reply.send(data);
    });

    // Get document by ID
    app.get('/api/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const documentService = services.get('document');
        const data = await documentService.get(`/documents/${id}`);
        return reply.send(data);
    });

    // List documents with filters
    app.get('/api/documents', async (request: FastifyRequest, reply: FastifyReply) => {
        const documentService = services.get('document');
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/documents?${queryString}` : '/documents';
        const data = await documentService.get(path);
        return reply.send(data);
    });

    // Get documents by entity
    app.get('/api/documents/entity/:entityType/:entityId', async (request: FastifyRequest, reply: FastifyReply) => {
        const { entityType, entityId } = request.params as { entityType: string; entityId: string };
        const documentService = services.get('document');
        const data = await documentService.get(`/documents/entity/${entityType}/${entityId}`);
        return reply.send(data);
    });

    // Delete document (requires ownership check or admin role)
    app.delete('/api/documents/:id', {
        preHandler: requireRoles(['recruiter', 'company_admin', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const documentService = services.get('document');
        await documentService.delete(`/documents/${id}`);
        return reply.status(204).send();
    });

    // Billing service routes

    // Stripe webhook (NO AUTH - verified by Stripe signature)
    // This route needs special handling to preserve raw body for signature verification
    app.post('/api/billing/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);

        // Forward the webhook with body and stripe-signature header
        const data = await billingService.post(
            '/webhooks/stripe',
            request.body,
            correlationId,
            {
                'stripe-signature': request.headers['stripe-signature'] as string,
            }
        );
        return reply.send(data);
    });

    // Billing plans (authenticated)
    app.get('/api/billing/plans', async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.get('/plans', undefined, correlationId);
        return reply.send(data);
    });

    app.get('/api/billing/plans/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.get(`/plans/${id}`, undefined, correlationId);
        return reply.send(data);
    });

    // Subscriptions (authenticated, role-based)
    app.get('/api/billing/subscriptions/recruiter/:recruiterId', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.get(`/subscriptions/recruiter/${recruiterId}`, undefined, correlationId);
        return reply.send(data);
    });

    app.get('/api/billing/subscriptions/recruiter/:recruiterId/status', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.get(`/subscriptions/recruiter/${recruiterId}/status`, undefined, correlationId);
        return reply.send(data);
    });

    app.post('/api/billing/subscriptions', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.post('/subscriptions', request.body, correlationId);
        return reply.status(201).send(data);
    });

    app.post('/api/billing/subscriptions/:recruiterId/cancel', {
        preHandler: requireRoles(['recruiter', 'platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { recruiterId } = request.params as { recruiterId: string };
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);
        const data = await billingService.post(`/subscriptions/${recruiterId}/cancel`, undefined, correlationId);
        return reply.send(data);
    });

    // Admin stats endpoint (aggregates stats from multiple services)
    app.get('/api/admin/stats', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const networkService = services.get('network');
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);

        // Fetch stats from each service in parallel
        const [recruiterStats, atsStats] = await Promise.all([
            networkService.get('/stats', undefined, correlationId),
            atsService.get('/stats', undefined, correlationId),
        ]);

        // Combine stats from all services
        const stats = {
            totalRecruiters: (recruiterStats as any).data?.totalRecruiters || 0,
            activeRecruiters: (recruiterStats as any).data?.activeRecruiters || 0,
            pendingRecruiters: (recruiterStats as any).data?.pendingRecruiters || 0,
            totalJobs: (atsStats as any).data?.totalJobs || 0,
            activeJobs: (atsStats as any).data?.activeJobs || 0,
            totalApplications: (atsStats as any).data?.totalApplications || 0,
            totalPlacements: (atsStats as any).data?.totalPlacements || 0,
        };

        return reply.send({ data: stats });
    });

    // ========================================================================
    // Dashboard Routes - Persona-Specific Insights
    // ========================================================================

    // Recruiter Dashboard
    app.get('/api/recruiter/dashboard/stats', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const networkService = services.get('network');
        const atsService = services.get('ats');
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);

        try {
            // Get recruiter profile
            const recruiterResponse: any = await networkService.get(
                `/recruiters/by-user/${req.auth.userId}`,
                undefined,
                correlationId
            );
            const recruiterId = recruiterResponse.data?.id;

            if (!recruiterId) {
                return reply.send({
                    data: {
                        active_roles: 0,
                        candidates_in_process: 0,
                        offers_pending: 0,
                        placements_this_month: 0,
                        placements_this_year: 0,
                        total_earnings_ytd: 0,
                        pending_payouts: 0,
                    }
                });
            }

            // Get assigned job IDs
            const jobsResponse: any = await networkService.get(
                `/recruiters/${recruiterId}/jobs`,
                undefined,
                correlationId
            );
            const jobIds = jobsResponse.data || [];

            // Get stats from ATS for recruiter's jobs
            // TODO: Add recruiter-specific stats endpoint in ATS service
            const stats = {
                active_roles: jobIds.length,
                candidates_in_process: 0, // TODO: Count from applications
                offers_pending: 0, // TODO: Count offers
                placements_this_month: 0, // TODO: Count from placements
                placements_this_year: 0, // TODO: Count from placements
                total_earnings_ytd: 0, // TODO: Sum from payouts
                pending_payouts: 0, // TODO: Sum from billing service
            };

            return reply.send({ data: stats });
        } catch (error) {
            console.error('Error fetching recruiter dashboard stats:', error);
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/recruiter/dashboard/activity', {
        preHandler: requireRoles(['recruiter']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement activity feed for recruiter
        // Query recent events from ATS for recruiter's candidates
        return reply.send({ data: [] });
    });

    // Company Dashboard
    app.get('/api/company/dashboard/stats', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const correlationId = getCorrelationId(request);

        try {
            // Get company ID from user memberships
            const companyMembership = req.auth.memberships?.find(
                m => m.role === 'company_admin' || m.role === 'hiring_manager'
            );

            if (!companyMembership) {
                return reply.status(403).send({ error: 'No company association found' });
            }

            // TODO: Add company-specific stats endpoint in ATS service
            const stats = {
                active_roles: 0,
                total_applications: 0,
                interviews_scheduled: 0,
                offers_extended: 0,
                placements_this_month: 0,
                placements_this_year: 0,
                avg_time_to_hire_days: 0,
                active_recruiters: 0,
            };

            return reply.send({ data: stats });
        } catch (error) {
            console.error('Error fetching company dashboard stats:', error);
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/company/dashboard/roles', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement role breakdown with pipeline stats
        return reply.send({ data: [] });
    });

    app.get('/api/company/dashboard/activity', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement activity feed for company roles
        return reply.send({ data: [] });
    });

    // Admin Dashboard
    app.get('/api/admin/dashboard/stats', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const atsService = services.get('ats');
        const networkService = services.get('network');
        const billingService = services.get('billing');
        const correlationId = getCorrelationId(request);

        try {
            // TODO: Aggregate platform-wide stats from all services
            const stats = {
                total_active_roles: 0,
                total_applications: 0,
                total_active_recruiters: 0,
                total_companies: 0,
                placements_this_month: 0,
                placements_this_year: 0,
                total_platform_revenue_ytd: 0,
                pending_payouts: 0,
                pending_approvals: 0,
                fraud_alerts: 0,
            };

            return reply.send({ data: stats });
        } catch (error) {
            console.error('Error fetching admin dashboard stats:', error);
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/admin/dashboard/health', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Calculate marketplace health metrics
        const health = {
            recruiter_satisfaction: 0,
            company_satisfaction: 0,
            avg_time_to_first_candidate_days: 0,
            avg_time_to_placement_days: 0,
            fill_rate_percentage: 0,
        };

        return reply.send({ data: health });
    });

    app.get('/api/admin/dashboard/activity', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement platform-wide activity feed
        return reply.send({ data: [] });
    });

    app.get('/api/admin/dashboard/alerts', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Aggregate alerts from all services
        // - Pending payout approvals
        // - Fraud signals
        // - Automation approvals
        // - System alerts
        return reply.send({ data: [] });
    });

    // ========================================================================
    // Phase 3 Admin Routes - Automation, Intelligence & Scale
    // ========================================================================

    // Automation Rules Management
    app.get('/api/admin/automation/rules', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        // For now, return empty array
        return reply.send({ data: [] });
    });

    app.patch('/api/admin/automation/rules/:ruleId', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.status(501).send({ error: 'Not implemented yet' });
    });

    // Automation Executions (Pending Approvals)
    app.get('/api/admin/automation/executions', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.send({ data: [] });
    });

    app.post('/api/admin/automation/executions/:executionId/approve', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.status(501).send({ error: 'Not implemented yet' });
    });

    app.post('/api/admin/automation/executions/:executionId/reject', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.status(501).send({ error: 'Not implemented yet' });
    });

    // Decision Audit Log
    app.get('/api/admin/decision-log', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        // Query from platform.decision_audit_log table
        return reply.send({ data: [], total: 0 });
    });

    // Marketplace Metrics
    app.get('/api/admin/metrics', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement metrics aggregation
        // Query from platform.marketplace_metrics_daily table
        const { days } = request.query as { days?: string };
        return reply.send({ data: [] });
    });

    // Fraud Signals - already exist in fraud page, keeping for reference
    app.get('/api/automation/fraud/signals', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.send({ data: [] });
    });

    app.post('/api/automation/fraud/signals/:signalId/resolve', {
        preHandler: requireRoles(['platform_admin']),
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement when automation-service is built
        return reply.status(501).send({ error: 'Not implemented yet' });
    });
}


