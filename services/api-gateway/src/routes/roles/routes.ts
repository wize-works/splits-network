import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest, isAdmin, isCompanyUser, isRecruiter } from '../../rbac';

/**
 * Roles Routes (RBAC-Filtered Job Listings)
 * - GET /api/roles - Get jobs filtered by user role
 * 
 * RBAC Data Scoping Rules:
 * - Platform admins: see all jobs
 * - Company users: see only their company's jobs
 * - Recruiters: see all active jobs (marketplace model - they need to discover opportunities)
 */
export function registerRolesRoutes(app: FastifyInstance, services: ServiceRegistry) {
    /**
     * Get jobs filtered by user role (RBAC enforced)
     */
    app.get('/api/roles', {
        schema: {
            description: 'Get jobs filtered by user role',
            tags: ['roles'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const atsService = services.get('ats');
        const networkService = services.get('network');
        const correlationId = (request as any).correlationId;

        const isUserAdmin = isAdmin(req.auth);
        const isUserCompany = isCompanyUser(req.auth);
        const isUserRecruiter = isRecruiter(req.auth);

        const queryParams = request.query as any;
        let jobIds: string[] | undefined;
        let companyIds: string[] | undefined;

        // Platform admins see everything - no filtering
        if (isUserAdmin) {
            // No filtering needed
        }
        // Company users see only their company's jobs
        else if (isUserCompany) {
            const companyMemberships = req.auth.memberships.filter(
                m => m.role === 'company_admin' || m.role === 'hiring_manager'
            );

            if (companyMemberships.length === 0) {
                return reply.send({ data: [] });
            }

            try {
                const companiesResponse: any = await atsService.get('/companies', undefined, correlationId);
                const allCompanies = companiesResponse.data || [];
                
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
        // Recruiters see all active jobs (marketplace model)
        // They need to discover opportunities to submit candidates
        else if (isUserRecruiter) {
            // Verify the user is an active recruiter
            try {
                const recruiterResponse: any = await networkService.get(
                    `/recruiters/by-user/${req.auth.userId}`,
                    undefined,
                    correlationId
                );

                // If recruiter doesn't exist or is not active, deny access
                if (!recruiterResponse.data || recruiterResponse.data.status !== 'active') {
                    return reply.status(403).send({ error: 'Active recruiter status required to view roles' });
                }
            } catch (error) {
                request.log.error({ error, userId: req.auth.userId }, 'Failed to verify recruiter status');
                return reply.status(403).send({ error: 'Failed to verify recruiter status' });
            }

            // No filtering by jobIds - recruiters see all jobs (will be filtered by status in query)
        }
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
            jobs = jobs.filter((job: any) => companyIds!.includes(job.company_id));
        } else if (jobIds) {
            jobs = jobs.filter((job: any) => jobIds!.includes(job.id));
        }

        return reply.send({ data: jobs });
    });
}
