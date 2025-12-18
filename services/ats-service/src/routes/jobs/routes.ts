import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from '../../service';
import { BadRequestError } from '@splits-network/shared-fastify';
import { CreateJobDTO } from '@splits-network/shared-types';

export function registerJobRoutes(app: FastifyInstance, service: AtsService) {
    // Get all jobs with optional filters
    app.get(
        '/jobs',
        async (request: FastifyRequest<{ 
            Querystring: { 
                status?: string; 
                search?: string; 
                location?: string;
                employment_type?: string;
                limit?: string; 
                offset?: string;
            } 
        }>, reply: FastifyReply) => {
            const { status, search, location, employment_type, limit, offset } = request.query;
            const result = await service.getJobs({
                status,
                search,
                location,
                employment_type,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
            });
            return reply.send({ 
                data: result.jobs,
                total: result.total,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : 0,
            });
        }
    );

    // Get job by ID
    app.get(
        '/jobs/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const job = await service.getJobById(request.params.id);
            return reply.send({ data: job });
        }
    );

    // Create new job
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
                recruiter_description,
                candidate_description,
                employment_type,
                open_to_relocation,
                show_salary_range,
                splits_fee_percentage,
                job_owner_id,
                status,
                requirements,
                pre_screen_questions,
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
                recruiter_description,
                candidate_description,
                employment_type,
                open_to_relocation: open_to_relocation ?? false,
                show_salary_range: show_salary_range ?? true,
                splits_fee_percentage: splits_fee_percentage ?? 50,
                job_owner_id,
                status,
                requirements,
                pre_screen_questions,
            });

            return reply.status(201).send({ data: job });
        }
    );

    // Update job
    app.patch(
        '/jobs/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateJobDTO> }>, reply: FastifyReply) => {
            const job = await service.updateJob(request.params.id, request.body as any);
            return reply.send({ data: job });
        }
    );

    // Get applications for a job
    app.get(
        '/jobs/:jobId/applications',
        async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
            const applications = await service.getApplicationsByJobId(request.params.jobId);
            return reply.send({ data: applications });
        }
    );
}
