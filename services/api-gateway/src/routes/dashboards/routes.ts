import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { requireRoles, AuthenticatedRequest, isRecruiter, isCompanyUser } from '../../rbac';

/**
 * Dashboard Routes
 * - Persona-specific dashboard stats and insights
 */
export function registerDashboardsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const networkService = () => services.get('network');
    const atsService = () => services.get('ats');
    const billingService = () => services.get('billing');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // ========================================================================
    // Recruiter Dashboard
    // ========================================================================

    app.get('/api/recruiter/dashboard/stats', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Get recruiter dashboard stats',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        try {
            // Get recruiter profile
            const recruiterResponse: any = await networkService().get(
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
            const jobsResponse: any = await networkService().get(
                `/recruiters/${recruiterId}/jobs`,
                undefined,
                correlationId
            );
            const jobIds = jobsResponse.data || [];

            // TODO: Add recruiter-specific stats endpoint in ATS service
            const stats = {
                active_roles: jobIds.length,
                candidates_in_process: 0,
                offers_pending: 0,
                placements_this_month: 0,
                placements_this_year: 0,
                total_earnings_ytd: 0,
                pending_payouts: 0,
            };

            return reply.send({ data: stats });
        } catch (error) {
            request.log.error({ error }, 'Error fetching recruiter dashboard stats');
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/recruiter/dashboard/activity', {
        preHandler: requireRoles(['recruiter']),
        schema: {
            description: 'Get recruiter dashboard activity feed',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement activity feed for recruiter
        return reply.send({ data: [] });
    });

    // ========================================================================
    // Company Dashboard
    // ========================================================================

    app.get('/api/company/dashboard/stats', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
        schema: {
            description: 'Get company dashboard stats',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;

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
            request.log.error({ error }, 'Error fetching company dashboard stats');
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/company/dashboard/roles', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
        schema: {
            description: 'Get company dashboard roles breakdown',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement role breakdown with pipeline stats
        return reply.send({ data: [] });
    });

    app.get('/api/company/dashboard/activity', {
        preHandler: requireRoles(['company_admin', 'hiring_manager']),
        schema: {
            description: 'Get company dashboard activity feed',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement activity feed for company roles
        return reply.send({ data: [] });
    });

    // ========================================================================
    // Admin Dashboard
    // ========================================================================

    app.get('/api/admin/dashboard/stats', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get admin dashboard stats',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
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
            request.log.error({ error }, 'Error fetching admin dashboard stats');
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/admin/dashboard/health', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get marketplace health metrics',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
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
        schema: {
            description: 'Get admin dashboard activity feed',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Implement platform-wide activity feed
        return reply.send({ data: [] });
    });

    app.get('/api/admin/dashboard/alerts', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get admin dashboard alerts',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // TODO: Aggregate alerts from all services
        return reply.send({ data: [] });
    });

    // ========================================================================
    // Candidate Dashboard
    // ========================================================================

    app.get('/api/candidate/dashboard/stats', {
        schema: {
            description: 'Get candidate dashboard stats',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        try {
            // Get candidate profile by email from Clerk
            const userEmail = req.auth?.email;
            if (!userEmail) {
                return reply.send({
                    data: {
                        applications: 0,
                        interviews: 0,
                        offers: 0,
                        active_relationships: 0,
                    }
                });
            }

            // Try to find candidate by email
            let candidateId: string | null = null;
            try {
                const candidatesResponse: any = await atsService().get(
                    `/candidates?email=${encodeURIComponent(userEmail)}`,
                    undefined,
                    correlationId
                );
                const candidates = candidatesResponse.data || [];
                if (candidates.length > 0) {
                    candidateId = candidates[0].id;
                }
            } catch (error) {
                request.log.warn({ error, email: userEmail }, 'Could not find candidate profile');
            }

            if (!candidateId) {
                return reply.send({
                    data: {
                        applications: 0,
                        interviews: 0,
                        offers: 0,
                        active_relationships: 0,
                    }
                });
            }

            // Get applications for this candidate
            const applicationsResponse: any = await atsService().get(
                `/applications?candidate_id=${candidateId}`,
                undefined,
                correlationId
            );
            const applications = applicationsResponse.data || [];

            // Calculate stats from applications
            const interviewStages = ['phone_screen', 'technical_interview', 'onsite_interview', 'final_interview'];
            const offerStages = ['offer_extended'];
            
            const interviews = applications.filter((app: any) => 
                interviewStages.includes(app.stage)
            ).length;
            
            const offers = applications.filter((app: any) => 
                offerStages.includes(app.stage)
            ).length;

            // Get active recruiter relationships
            let activeRelationships = 0;
            try {
                const relationshipsResponse: any = await networkService().get(
                    `/recruiter-candidates/candidate/${candidateId}`,
                    undefined,
                    correlationId
                );
                const relationships = relationshipsResponse.data || [];
                activeRelationships = relationships.filter((rel: any) => rel.status === 'active').length;
            } catch (error) {
                request.log.warn({ error, candidateId }, 'Could not get recruiter relationships');
            }

            const stats = {
                applications: applications.length,
                interviews,
                offers,
                active_relationships: activeRelationships,
            };

            return reply.send({ data: stats });
        } catch (error) {
            request.log.error({ error }, 'Error fetching candidate dashboard stats');
            return reply.status(500).send({ error: 'Failed to load dashboard stats' });
        }
    });

    app.get('/api/candidate/dashboard/recent-applications', {
        schema: {
            description: 'Get candidate recent applications',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        try {
            // Get candidate profile by email from Clerk
            const userEmail = req.auth?.email;
            if (!userEmail) {
                return reply.send({ data: [] });
            }

            // Try to find candidate by email
            let candidateId: string | null = null;
            try {
                const candidatesResponse: any = await atsService().get(
                    `/candidates?email=${encodeURIComponent(userEmail)}`,
                    undefined,
                    correlationId
                );
                const candidates = candidatesResponse.data || [];
                if (candidates.length > 0) {
                    candidateId = candidates[0].id;
                }
            } catch (error) {
                request.log.warn({ error, email: userEmail }, 'Could not find candidate profile');
            }

            if (!candidateId) {
                return reply.send({ data: [] });
            }

            // Get recent applications (limit 5)
            const applicationsResponse: any = await atsService().get(
                `/applications?candidate_id=${candidateId}`,
                undefined,
                correlationId
            );
            const applications = applicationsResponse.data || [];

            // Get job details for each application
            const recentApps = await Promise.all(
                applications.slice(0, 5).map(async (app: any) => {
                    try {
                        const jobResponse: any = await atsService().get(
                            `/jobs/${app.job_id}`,
                            undefined,
                            correlationId
                        );
                        const job = jobResponse.data;

                        return {
                            id: app.id,
                            job_id: app.job_id,
                            job_title: job?.title || 'Unknown Position',
                            company: job?.company?.name || 'Unknown Company',
                            status: app.stage,
                            applied_at: app.created_at,
                        };
                    } catch (error) {
                        request.log.warn({ error, applicationId: app.id }, 'Could not get job details');
                        return {
                            id: app.id,
                            job_id: app.job_id,
                            job_title: 'Unknown Position',
                            company: 'Unknown Company',
                            status: app.stage,
                            applied_at: app.created_at,
                        };
                    }
                })
            );

            return reply.send({ data: recentApps });
        } catch (error) {
            request.log.error({ error }, 'Error fetching recent applications');
            return reply.status(500).send({ error: 'Failed to load recent applications' });
        }
    });

    app.get('/api/candidate/applications', {
        schema: {
            description: 'Get all candidate applications',
            tags: ['dashboards', 'candidates'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const correlationId = getCorrelationId(request);

        try {
            // Get candidate profile by email from Clerk
            const userEmail = req.auth?.email;
            if (!userEmail) {
                return reply.send({ data: [] });
            }

            // Try to find candidate by email
            let candidateId: string | null = null;
            try {
                const candidatesResponse: any = await atsService().get(
                    `/candidates?email=${encodeURIComponent(userEmail)}`,
                    undefined,
                    correlationId
                );
                const candidates = candidatesResponse.data || [];
                if (candidates.length > 0) {
                    candidateId = candidates[0].id;
                }
            } catch (error) {
                request.log.warn({ error, email: userEmail }, 'Could not find candidate profile');
            }

            if (!candidateId) {
                return reply.send({ data: [] });
            }

            // Get all applications for this candidate
            const applicationsResponse: any = await atsService().get(
                `/applications?candidate_id=${candidateId}`,
                undefined,
                correlationId
            );
            const applications = applicationsResponse.data || [];

            // Get job details for each application
            const fullApplications = await Promise.all(
                applications.map(async (app: any) => {
                    try {
                        const jobResponse: any = await atsService().get(
                            `/jobs/${app.job_id}`,
                            undefined,
                            correlationId
                        );
                        const job = jobResponse.data;

                        return {
                            id: app.id,
                            job_id: app.job_id,
                            job_title: job?.title || 'Unknown Position',
                            company: job?.company?.name || 'Unknown Company',
                            location: job?.location || 'Remote',
                            status: app.stage,
                            stage: app.stage,
                            applied_at: app.created_at,
                            updated_at: app.updated_at,
                            notes: app.notes,
                        };
                    } catch (error) {
                        request.log.warn({ error, applicationId: app.id }, 'Could not get job details');
                        return {
                            id: app.id,
                            job_id: app.job_id,
                            job_title: 'Unknown Position',
                            company: 'Unknown Company',
                            location: 'Remote',
                            status: app.stage,
                            stage: app.stage,
                            applied_at: app.created_at,
                            updated_at: app.updated_at,
                            notes: app.notes,
                        };
                    }
                })
            );

            return reply.send({ data: fullApplications });
        } catch (error) {
            request.log.error({ error }, 'Error fetching applications');
            return reply.status(500).send({ error: 'Failed to load applications' });
        }
    });

    // Legacy: Admin stats endpoint (aggregates from multiple services)
    app.get('/api/admin/stats', {
        preHandler: requireRoles(['platform_admin']),
        schema: {
            description: 'Get admin stats (legacy)',
            tags: ['dashboards'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);

        // Fetch stats from each service in parallel
        const [recruiterStats, atsStats] = await Promise.all([
            networkService().get('/stats', undefined, correlationId),
            atsService().get('/stats', undefined, correlationId),
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
}
