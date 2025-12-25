import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from '../../service';
import { BadRequestError } from '@splits-network/shared-fastify';
import { SubmitCandidateDTO, UpdateApplicationStageDTO } from '@splits-network/shared-types';

/**
 * Applications Routes
 * 
 * Receives Clerk user ID from API Gateway (in x-clerk-user-id header).
 * Services handle entity resolution internally (e.g., Clerk userId → recruiter_id).
 */

/**
 * Extract user context from gateway-provided headers
 */
function getUserContext(request: FastifyRequest): { clerkUserId: string; userRole: 'candidate' | 'recruiter' | 'company' | 'admin' } {
    const clerkUserId = request.headers['x-clerk-user-id'] as string;
    const userRole = (request.headers['x-user-role'] as string) || 'candidate';
    
    if (!clerkUserId) {
        throw new Error('Missing x-clerk-user-id header');
    }
    
    return { 
        clerkUserId, 
        userRole: userRole as 'candidate' | 'recruiter' | 'company' | 'admin'
    };
}

export function registerApplicationRoutes(app: FastifyInstance, service: AtsService) {
    // Get paginated applications with optional filters and search
    app.get(
        '/applications/paginated',
        async (request: FastifyRequest<{ 
            Querystring: { 
                page?: string;
                limit?: string;
                search?: string;
                stage?: string;
                job_id?: string;
                candidate_id?: string;
                company_id?: string;
                sort_by?: string;
                sort_order?: 'asc' | 'desc';
            } 
        }>, reply: FastifyReply) => {
            const { clerkUserId, userRole } = getUserContext(request);
            const correlationId = (request as any).correlationId;
            
            const page = request.query.page ? parseInt(request.query.page, 10) : 1;
            const limit = request.query.limit ? parseInt(request.query.limit, 10) : 25;
            
            console.log('[DEBUG] /applications/paginated query params:', {
                clerkUserId,
                userRole,
                page,
                limit,
                search: request.query.search,
                stage: request.query.stage,
            });
            
            // Note: recruiter_id is now resolved internally by the service from clerkUserId
            const result = await service.getApplicationsPaginated({
                clerkUserId,
                userRole,
                page,
                limit,
                search: request.query.search,
                stage: request.query.stage,
                job_id: request.query.job_id,
                candidate_id: request.query.candidate_id,
                company_id: request.query.company_id,
                sort_by: request.query.sort_by,
                sort_order: request.query.sort_order,
            }, correlationId);
            
            console.log('[DEBUG] Result:', {
                total: result.total,
                returned: result.data.length,
                recruiter_ids: result.data.map(app => app.recruiter_id),
            });
            
            return reply.send({ 
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    total_pages: result.total_pages,
                }
            });
        }
    );

    // Get all applications with optional filters (legacy endpoint)
    app.get(
        '/applications',
        async (request: FastifyRequest<{ Querystring: { recruiter_id?: string; job_id?: string; stage?: string; candidate_id?: string } }>, reply: FastifyReply) => {
            const { recruiter_id, job_id, stage, candidate_id } = request.query;
            
            // If candidate_id is provided, use specific method for better performance
            if (candidate_id) {
                const applications = await service.getApplicationsByCandidateId(candidate_id);
                return reply.send({ data: applications });
            }
            
            const applications = await service.getApplications({ recruiter_id, job_id, stage });
            return reply.send({ data: applications });
        }
    );

    // Get application by ID
    app.get(
        '/applications/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const application = await service.getApplicationById(request.params.id);
            return reply.send({ data: application });
        }
    );

    // Candidate self-service: submit application
    app.post(
        '/applications/submit',
        async (request: FastifyRequest<{
            Body: {
                job_id: string;
                cover_letter?: string;
                resume_url?: string;
            };
        }>, reply: FastifyReply) => {
            const userId = request.headers['x-clerk-user-id'] as string;
            const correlationId = (request as any).correlationId;
            
            if (!userId) {
                return reply.status(401).send({ 
                    error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } 
                });
            }

            const { job_id, cover_letter, resume_url } = request.body;
            
            if (!job_id) {
                throw new BadRequestError('job_id is required');
            }

            // Look up candidate by user_id using the repository directly
            const allCandidates = await service.getCandidates({ limit: 1000 });
            const candidate = allCandidates.find((c: any) => c.user_id === userId);
            
            if (!candidate) {
                return reply.status(404).send({ 
                    error: { code: 'NOT_FOUND', message: 'Candidate profile not found' } 
                });
            }

            // Check if already applied to this job
            const existingApplications = await service.getApplications({
                job_id,
            });

            const alreadyApplied = existingApplications.some((app: any) => app.candidate_id === candidate.id);
            if (alreadyApplied) {
                return reply.status(409).send({ 
                    error: { code: 'ALREADY_APPLIED', message: 'You have already applied to this job' } 
                });
            }

            // Use submitCandidate which will create candidate record if needed
            const application = await service.submitCandidate(
                job_id,
                candidate.email,
                candidate.full_name,
                undefined, // Self-submitted, no recruiter yet
                { cover_letter, resume_url }
            );

            request.log.info({
                applicationId: application.id,
                candidateId: candidate.id,
                jobId: job_id,
                userId,
            }, 'Candidate submitted application');

            return reply.status(201).send({ data: application });
        }
    );

    // Candidate self-service: withdraw application
    app.post(
        '/applications/:id/withdraw',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: {
                reason?: string;
            };
        }>, reply: FastifyReply) => {
            const userId = request.headers['x-clerk-user-id'] as string;
            const correlationId = (request as any).correlationId;
            
            if (!userId) {
                return reply.status(401).send({ 
                    error: { code: 'UNAUTHORIZED', message: 'Missing user ID' } 
                });
            }

            const { id: applicationId } = request.params;

            // Look up candidate by user_id
            const allCandidates = await service.getCandidates({ limit: 1000 });
            const candidate = allCandidates.find((c: any) => c.user_id === userId);
            
            if (!candidate) {
                return reply.status(404).send({ 
                    error: { code: 'NOT_FOUND', message: 'Candidate profile not found' } 
                });
            }

            // Get application and verify ownership
            const application = await service.getApplicationById(applicationId);
            
            if (!application) {
                return reply.status(404).send({ 
                    error: { code: 'NOT_FOUND', message: 'Application not found' } 
                });
            }

            if (application.candidate_id !== candidate.id) {
                return reply.status(403).send({ 
                    error: { code: 'FORBIDDEN', message: 'You can only withdraw your own applications' } 
                });
            }

            // Update application stage to withdrawn
            const updatedApplication = await service.updateApplicationStage(applicationId, 'withdrawn');

            request.log.info({
                applicationId,
                candidateId: candidate.id,
                userId,
                reason: request.body.reason,
            }, 'Candidate withdrew application');

            return reply.send({ data: updatedApplication });
        }
    );

    // Create new application (submit candidate)
    app.post(
        '/applications',
        async (request: FastifyRequest<{ Body: SubmitCandidateDTO }>, reply: FastifyReply) => {
            const { job_id, full_name, email, linkedin_url, notes } = request.body;

            if (!job_id || !full_name || !email) {
                throw new BadRequestError('Missing required fields');
            }

            // TODO: Extract recruiter_id from authenticated user context
            const recruiterId = (request.body as any).recruiter_id;

            const application = await service.submitCandidate(
                job_id,
                email,
                full_name,
                recruiterId,
                { linkedin_url, notes }
            );

            return reply.status(201).send({ data: application });
        }
    );

    // Update application stage
    app.patch(
        '/applications/:id/stage',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateApplicationStageDTO }>, reply: FastifyReply) => {
            const { stage, notes } = request.body;

            if (!stage) {
                throw new BadRequestError('Stage is required');
            }

            // Extract audit context
            const auditContext = {
                userId: (request as any).auth?.userId,
                userRole: (request as any).auth?.memberships?.[0]?.role,
                companyId: (request as any).auth?.memberships?.[0]?.organization_id,
            };

            const application = await service.updateApplicationStage(
                request.params.id,
                stage as any,
                notes,
                auditContext
            );

            request.log.info({
                applicationId: request.params.id,
                newStage: stage,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
            }, 'Application stage updated');

            return reply.send({ data: application });
        }
    );

    // Add note to application (without changing stage)
    app.patch(
        '/applications/:id/notes',
        async (request: FastifyRequest<{ Params: { id: string }; Body: { note: string } }>, reply: FastifyReply) => {
            const { note } = request.body;

            if (!note || !note.trim()) {
                throw new BadRequestError('Note is required');
            }

            // Extract audit context
            const auditContext = {
                userId: (request as any).auth?.userId,
                userRole: (request as any).auth?.memberships?.[0]?.role,
                companyId: (request as any).auth?.memberships?.[0]?.organization_id,
            };

            const application = await service.addApplicationNote(
                request.params.id,
                note.trim(),
                auditContext
            );

            request.log.info({
                applicationId: request.params.id,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
            }, 'Note added to application');

            return reply.send({ data: application });
        }
    );

    // Accept application
    app.post(
        '/applications/:id/accept',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            // Extract audit context from request
            const auditContext = {
                userId: (request as any).auth?.userId,
                userRole: (request as any).auth?.memberships?.[0]?.role,
                companyId: (request as any).auth?.memberships?.[0]?.organization_id,
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
            };

            const application = await service.acceptApplication(
                request.params.id,
                auditContext
            );
            
            request.log.info({
                applicationId: request.params.id,
                userId: auditContext.userId,
                userRole: auditContext.userRole,
                companyId: auditContext.companyId,
            }, 'Application accepted by company');

            return reply.send({ data: application });
        }
    );

    // Get audit log for an application
    app.get(
        '/applications/:id/audit-log',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const auditLog = await service.getApplicationAuditLog(request.params.id);
            return reply.send({ data: auditLog });
        }
    );

    // Submit candidate application with documents (advanced flow)
    app.post(
        '/applications/submit-advanced',
        async (request: FastifyRequest<{ Body: {
            job_id: string;
            document_ids: string[];
            primary_resume_id: string;
            pre_screen_answers?: Array<{ question_id: string; answer: any }>;
            notes?: string;
        } }>, reply: FastifyReply) => {
            const { job_id, document_ids, primary_resume_id, pre_screen_answers, notes } = request.body;
            
            // Get candidate email and user ID from headers (passed by API Gateway)
            const email = request.headers['x-user-email'] as string;
            const userId = request.headers['x-clerk-user-id'] as string;

            if (!email) {
                throw new BadRequestError('Candidate email is required');
            }

            if (!job_id || !document_ids || document_ids.length === 0 || !primary_resume_id) {
                throw new BadRequestError('Missing required fields: job_id, document_ids, primary_resume_id');
            }

            // Look up candidate by email
            const candidates = await service.getCandidates({ search: email, limit: 10 });
            if (candidates.length === 0) {
                return reply.status(404).send({ 
                    error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' } 
                });
            }

            const candidate = candidates[0];

            const result = await service.submitCandidateApplication({
                candidateId: candidate.id,
                candidateUserId: userId,
                jobId: job_id,
                documentIds: document_ids,
                primaryResumeId: primary_resume_id,
                preScreenAnswers: pre_screen_answers,
                notes,
            });

            request.log.info({
                applicationId: result.application.id,
                jobId: job_id,
                candidateId: candidate.id,
                hasRecruiter: result.hasRecruiter,
                stage: result.application.stage,
            }, 'Candidate submitted application');

            return reply.status(201).send({ data: result });
        }
    );

    // Withdraw application
    app.post(
        '/applications/:id/withdraw',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: { reason?: string };
        }>, reply: FastifyReply) => {
            // Get candidate email and user ID from headers (passed by API Gateway)
            const email = request.headers['x-user-email'] as string;
            const userId = request.headers['x-clerk-user-id'] as string;

            if (!email) {
                throw new BadRequestError('Candidate email is required');
            }

            // Look up candidate by email
            const candidates = await service.getCandidates({ search: email, limit: 10 });
            if (candidates.length === 0) {
                return reply.status(404).send({ 
                    error: { code: 'CANDIDATE_NOT_FOUND', message: 'Candidate profile not found' } 
                });
            }

            const candidate = candidates[0];

            const application = await service.withdrawApplication(
                request.params.id,
                candidate.id,
                userId,
                request.body.reason
            );

            request.log.info({
                applicationId: request.params.id,
                candidateId: candidate.id,
                candidateUserId: userId,
                reason: request.body.reason,
            }, 'Application withdrawn by candidate');

            return reply.send({ data: application });
        }
    );

    // Get pending applications for recruiter
    app.get(
        '/recruiters/:recruiterId/pending-applications',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const applications = await service.getPendingApplicationsForRecruiter(request.params.recruiterId);
            return reply.send({ data: applications });
        }
    );

    // Recruiter submits application to company
    app.post(
        '/applications/:id/recruiter-submit',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: { recruiter_notes?: string };
        }>, reply: FastifyReply) => {
            // Extract recruiter ID from auth context
            const recruiterId = (request as any).auth?.userId;

            if (!recruiterId) {
                throw new BadRequestError('Recruiter ID not found in auth context');
            }

            const application = await service.recruiterSubmitApplication(
                request.params.id,
                recruiterId,
                { recruiterNotes: request.body.recruiter_notes }
            );

            request.log.info({
                applicationId: request.params.id,
                recruiterId,
                stage: application.stage,
            }, 'Recruiter submitted application to company');

            return reply.send({ data: application });
        }
    );

    // Get pre-screen questions for a job
    app.get(
        '/jobs/:jobId/pre-screen-questions',
        async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
            const questions = await service.getPreScreenQuestionsForJob(request.params.jobId);
            return reply.send({ data: questions });
        }
    );

    // Get application details with job, company, candidate, documents, and pre-screen answers
    app.get(
        '/applications/:id/full',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const application = await service.getApplicationById(request.params.id);
            
            // Fetch all related data
            let documents: any[] = [];
            let preScreenAnswers: any[] = [];
            let questions: any[] = [];
            let auditLog: any[] = [];
            let candidate: any = null;
            
            try {
                documents = await service.getDocumentsForApplication(request.params.id);
            } catch (err) {
                // Documents not found - continue without them
            }
            
            try {
                preScreenAnswers = await service.getPreScreenAnswersForApplication(request.params.id);
            } catch (err) {
                // Pre-screen answers not found - continue without them
            }
            
            try {
                auditLog = await service.getApplicationAuditLog(request.params.id);
            } catch (err) {
                // Audit log not found - continue without it
            }

            // Fetch candidate details
            if (application.candidate_id) {
                try {
                    const candidateResponse = await service.getCandidateById(application.candidate_id);
                    candidate = candidateResponse;
                } catch (err) {
                    // Candidate not found - continue without it
                }
            }

            // Fetch job and company details
            let job = null;
            let company = null;

            if (application.job_id) {
                try {
                    job = await service.getJobById(application.job_id);
                    if (job?.company_id) {
                        company = await service.getCompanyById(job.company_id);
                        // Add company to job object for easier access
                        job = { ...job, company };
                    }
                    
                    // Get pre-screen questions for the job
                    try {
                        questions = await service.getPreScreenQuestionsForJob(application.job_id);
                    } catch (err) {
                        // No questions - that's okay
                    }
                } catch (err) {
                    // Job or company not found - continue without it
                }
            }

            return reply.send({
                data: {
                    application,
                    job,
                    candidate,
                    documents,
                    pre_screen_answers: preScreenAnswers,
                    questions,
                    workflow_events: auditLog,
                },
            });
        }
    );

    // Request pre-screen for direct application
    app.post(
        '/applications/:id/request-prescreen',
        async (
            request: FastifyRequest<{
                Params: { id: string };
                Body: {
                    company_id: string;
                    requested_by_user_id: string;
                    recruiter_id?: string;
                    message?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            const { company_id, requested_by_user_id, recruiter_id, message } = request.body;

            if (!company_id || !requested_by_user_id) {
                throw new BadRequestError('Missing required fields: company_id and requested_by_user_id');
            }

            const application = await service.requestPreScreen(
                request.params.id,
                company_id,
                requested_by_user_id,
                { recruiter_id, message }
            );

            request.log.info({
                applicationId: request.params.id,
                companyId: company_id,
                recruiterId: recruiter_id || 'auto-assign',
            }, 'Pre-screen requested for application');

            return reply.send({ data: application });
        }
    );

    // ========================================
    // Recruiter Submission Flow Endpoints
    // ========================================

    // Recruiter proposes job to candidate
    app.post(
        '/applications/recruiter-propose',
        async (request: FastifyRequest<{
            Body: {
                recruiter_id?: string;
                recruiter_user_id?: string;
                candidate_id: string;
                job_id: string;
                pitch?: string;
            };
        }>, reply: FastifyReply) => {
            const { candidate_id, job_id, pitch } = request.body;
            
            // Extract recruiter from auth context or request body
            const recruiterId = request.body.recruiter_id || (request as any).auth?.userId;
            const recruiterUserId = request.body.recruiter_user_id || (request as any).auth?.userId;

            if (!recruiterId || !recruiterUserId) {
                throw new BadRequestError('Recruiter ID not found in auth context');
            }

            if (!candidate_id || !job_id) {
                throw new BadRequestError('Missing required fields: candidate_id, job_id');
            }

            const application = await service.recruiterProposeJob({
                recruiterId,
                recruiterUserId,
                candidateId: candidate_id,
                jobId: job_id,
                pitch,
            });

            request.log.info({
                applicationId: application.id,
                recruiterId,
                candidateId: candidate_id,
                jobId: job_id,
            }, 'Recruiter proposed job to candidate');

            return reply.status(201).send({ data: application });
        }
    );

    // Candidate approves job opportunity
    app.post(
        '/applications/:id/candidate-approve',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: {
                candidate_id?: string;
                candidate_user_id?: string;
            };
        }>, reply: FastifyReply) => {
            const candidateId = request.body.candidate_id;
            const candidateUserId = request.body.candidate_user_id || (request as any).auth?.userId;

            if (!candidateId || !candidateUserId) {
                throw new BadRequestError('Candidate ID not found in request context');
            }

            const application = await service.candidateApproveOpportunity({
                applicationId: request.params.id,
                candidateId,
                candidateUserId,
            });

            request.log.info({
                applicationId: request.params.id,
                candidateId,
                action: 'approved_opportunity',
            }, 'Candidate approved job opportunity');

            return reply.send({ data: application });
        }
    );

    // Candidate declines job opportunity
    app.post(
        '/applications/:id/candidate-decline',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: {
                candidate_id?: string;
                candidate_user_id?: string;
                reason?: string;
                notes?: string;
            };
        }>, reply: FastifyReply) => {
            const candidateId = request.body.candidate_id;
            const candidateUserId = request.body.candidate_user_id || (request as any).auth?.userId;
            const { reason, notes } = request.body;

            if (!candidateId || !candidateUserId) {
                throw new BadRequestError('Candidate ID not found in request context');
            }

            const application = await service.candidateDeclineOpportunity({
                applicationId: request.params.id,
                candidateId,
                candidateUserId,
                reason,
                notes,
            });

            request.log.info({
                applicationId: request.params.id,
                candidateId,
                action: 'declined_opportunity',
                reason,
            }, 'Candidate declined job opportunity');

            return reply.send({ data: application });
        }
    );

    // Get pending opportunities for candidate
    app.get(
        '/candidates/:candidateId/pending-opportunities',
        async (request: FastifyRequest<{
            Params: { candidateId: string };
        }>, reply: FastifyReply) => {
            const opportunities = await service.getPendingOpportunitiesForCandidate(request.params.candidateId);
            return reply.send({ data: opportunities });
        }
    );

    // Get proposed jobs for recruiter dashboard
    app.get(
        '/recruiters/:recruiterId/proposed-jobs',
        async (request: FastifyRequest<{
            Params: { recruiterId: string };
            Querystring: { status?: 'pending' | 'approved' | 'declined' };
        }>, reply: FastifyReply) => {
            const proposedJobs = await service.getProposedJobsForRecruiter(request.params.recruiterId);
            
            // Filter by status if requested
            if (request.query.status) {
                const filtered = proposedJobs.filter(job => job.status === request.query.status);
                return reply.send({ data: filtered });
            }

            return reply.send({ data: proposedJobs });
        }
    );
}

