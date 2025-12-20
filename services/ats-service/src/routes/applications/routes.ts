import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from '../../service';
import { BadRequestError } from '@splits-network/shared-fastify';
import { SubmitCandidateDTO, UpdateApplicationStageDTO } from '@splits-network/shared-types';

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
                recruiter_id?: string;
                job_id?: string;
                candidate_id?: string;
                company_id?: string;
                sort_by?: string;
                sort_order?: 'asc' | 'desc';
            } 
        }>, reply: FastifyReply) => {
            const page = request.query.page ? parseInt(request.query.page, 10) : 1;
            const limit = request.query.limit ? parseInt(request.query.limit, 10) : 25;
            
            console.log('[DEBUG] /applications/paginated query params:', {
                recruiter_id: request.query.recruiter_id,
                page,
                limit,
                search: request.query.search,
                stage: request.query.stage,
            });
            
            const result = await service.getApplicationsPaginated({
                page,
                limit,
                search: request.query.search,
                stage: request.query.stage,
                recruiter_id: request.query.recruiter_id,
                job_id: request.query.job_id,
                candidate_id: request.query.candidate_id,
                company_id: request.query.company_id,
                sort_by: request.query.sort_by,
                sort_order: request.query.sort_order,
            });
            
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

    // Submit candidate application (new candidate-initiated flow)
    app.post(
        '/applications/submit',
        async (request: FastifyRequest<{ Body: {
            candidate_id: string;
            job_id: string;
            document_ids: string[];
            primary_resume_id: string;
            pre_screen_answers?: Array<{ question_id: string; answer: any }>;
            notes?: string;
        } }>, reply: FastifyReply) => {
            const { candidate_id, job_id, document_ids, primary_resume_id, pre_screen_answers, notes } = request.body;

            // Candidate ID should be provided by API Gateway
            if (!candidate_id) {
                throw new BadRequestError('Candidate ID is required');
            }

            if (!job_id || !document_ids || document_ids.length === 0 || !primary_resume_id) {
                throw new BadRequestError('Missing required fields: job_id, document_ids, primary_resume_id');
            }

            const result = await service.submitCandidateApplication({
                candidateId: candidate_id,
                jobId: job_id,
                documentIds: document_ids,
                primaryResumeId: primary_resume_id,
                preScreenAnswers: pre_screen_answers,
                notes,
            });

            request.log.info({
                applicationId: result.application.id,
                jobId: job_id,
                candidateId: candidate_id,
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
            // Extract candidate ID from auth context
            const candidateId = (request as any).auth?.userId;

            if (!candidateId) {
                throw new BadRequestError('Candidate ID not found in auth context');
            }

            const application = await service.withdrawApplication(
                request.params.id,
                candidateId,
                request.body.reason
            );

            request.log.info({
                applicationId: request.params.id,
                candidateId,
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
}

