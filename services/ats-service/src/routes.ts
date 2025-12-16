import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from './service';
import { NotFoundError, BadRequestError } from '@splits-network/shared-fastify';
import {
    CreateJobDTO,
    SubmitCandidateDTO,
    UpdateApplicationStageDTO,
    CreatePlacementDTO,
} from '@splits-network/shared-types';

export function registerRoutes(app: FastifyInstance, service: AtsService) {
    // Job routes
    app.get(
        '/jobs',
        async (request: FastifyRequest<{ Querystring: { status?: string; search?: string; limit?: string; offset?: string } }>, reply: FastifyReply) => {
            const { status, search, limit, offset } = request.query;
            const jobs = await service.getJobs({
                status,
                search,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return reply.send({ data: jobs });
        }
    );

    app.get(
        '/jobs/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const job = await service.getJobById(request.params.id);
            return reply.send({ data: job });
        }
    );

    app.get(
        '/companies/:companyId/jobs',
        async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
            const jobs = await service.getJobsByCompanyId(request.params.companyId);
            return reply.send({ data: jobs });
        }
    );

    app.post(
        '/jobs',
        async (request: FastifyRequest<{ Body: CreateJobDTO }>, reply: FastifyReply) => {
            const {
                title,
                company_id,
                fee_percentage,
                department,
                location,
                salary_min,
                salary_max,
                description,
                status,
            } = request.body as any;

            if (!title || !company_id || fee_percentage === undefined) {
                throw new BadRequestError('Missing required fields');
            }

            const job = await service.createJob(company_id, title, fee_percentage, {
                department,
                location,
                salary_min,
                salary_max,
                description,
                status,
            });

            return reply.status(201).send({ data: job });
        }
    );

    app.patch(
        '/jobs/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateJobDTO> }>, reply: FastifyReply) => {
            const job = await service.updateJob(request.params.id, request.body as any);
            return reply.send({ data: job });
        }
    );

    // Application routes
    app.get(
        '/applications',
        async (request: FastifyRequest<{ Querystring: { recruiter_id?: string; job_id?: string; stage?: string } }>, reply: FastifyReply) => {
            const { recruiter_id, job_id, stage } = request.query;
            const applications = await service.getApplications({ recruiter_id, job_id, stage });
            return reply.send({ data: applications });
        }
    );

    app.get(
        '/applications/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const application = await service.getApplicationById(request.params.id);
            return reply.send({ data: application });
        }
    );

    app.get(
        '/jobs/:jobId/applications',
        async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
            const applications = await service.getApplicationsByJobId(request.params.jobId);
            return reply.send({ data: applications });
        }
    );

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

    app.patch(
        '/applications/:id/stage',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateApplicationStageDTO }>, reply: FastifyReply) => {
            const { stage, notes } = request.body;

            if (!stage) {
                throw new BadRequestError('Stage is required');
            }

            const application = await service.updateApplicationStage(
                request.params.id,
                stage as any,
                notes
            );

            return reply.send({ data: application });
        }
    );

    // Candidate routes
    app.get(
        '/candidates',
        async (request: FastifyRequest<{ Querystring: { search?: string; limit?: string; offset?: string } }>, reply: FastifyReply) => {
            const { search, limit, offset } = request.query;
            const candidates = await service.getCandidates({
                search,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return reply.send({ data: candidates });
        }
    );

    app.get(
        '/candidates/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const candidate = await service.getCandidateById(request.params.id);
            return reply.send({ data: candidate });
        }
    );

    app.get(
        '/candidates/:id/applications',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const applications = await service.getApplicationsByCandidateId(request.params.id);
            return reply.send({ data: applications });
        }
    );

    // Placement routes
    app.get(
        '/placements',
        async (request: FastifyRequest<{
            Querystring: {
                recruiter_id?: string;
                company_id?: string;
                date_from?: string;
                date_to?: string;
            }
        }>, reply: FastifyReply) => {
            const { recruiter_id, company_id, date_from, date_to } = request.query;
            const placements = await service.getPlacements({
                recruiter_id,
                company_id,
                date_from,
                date_to,
            });
            return reply.send({ data: placements });
        }
    );

    app.get(
        '/placements/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const placement = await service.getPlacementById(request.params.id);
            return reply.send({ data: placement });
        }
    );

    app.post(
        '/placements',
        async (request: FastifyRequest<{ Body: CreatePlacementDTO }>, reply: FastifyReply) => {
            const { application_id, salary, fee_percentage } = request.body;

            if (!application_id || !salary || fee_percentage === undefined) {
                throw new BadRequestError('Missing required fields');
            }

            const placement = await service.createPlacement(
                application_id,
                salary,
                fee_percentage
            );

            return reply.status(201).send({ data: placement });
        }
    );

    // Company routes
    app.get(
        '/companies',
        async (request: FastifyRequest, reply: FastifyReply) => {
            const companies = await service.getCompanies();
            return reply.send({ data: companies });
        }
    );

    app.get(
        '/companies/by-org/:orgId',
        async (request: FastifyRequest<{ Params: { orgId: string } }>, reply: FastifyReply) => {
            const company = await service.getCompanyByOrgId(request.params.orgId);
            if (!company) {
                return reply.status(404).send({ 
                    error: { code: 'NOT_FOUND', message: 'Company not found for this organization' } 
                });
            }
            return reply.send({ data: company });
        }
    );

    app.get(
        '/companies/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const company = await service.getCompanyById(request.params.id);
            return reply.send({ data: company });
        }
    );

    app.post(
        '/companies',
        async (request: FastifyRequest<{ Body: { name: string; identity_organization_id?: string } }>, reply: FastifyReply) => {
            const { name, identity_organization_id } = request.body;

            if (!name) {
                throw new BadRequestError('Company name is required');
            }

            const company = await service.createCompany(name, identity_organization_id);
            return reply.status(201).send({ data: company });
        }
    );

    app.patch(
        '/companies/:id',
        async (request: FastifyRequest<{
            Params: { id: string };
            Body: { name?: string; identity_organization_id?: string }
        }>, reply: FastifyReply) => {
            const { name, identity_organization_id } = request.body;

            if (!name && !identity_organization_id) {
                throw new BadRequestError('At least one field must be provided');
            }

            const company = await service.updateCompany(request.params.id, { name, identity_organization_id });
            return reply.send({ data: company });
        }
    );

    // Stats endpoint for admin dashboard
    app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        const stats = await service.getStats();
        return reply.send({ data: stats });
    });
}
