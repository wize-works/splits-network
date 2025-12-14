import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NetworkService } from './service';
import { NotFoundError, BadRequestError } from '@splits-network/shared-fastify';

interface CreateRecruiterBody {
    user_id: string;
    bio?: string;
}

interface UpdateRecruiterStatusBody {
    status: 'pending' | 'active' | 'suspended';
}

interface AssignRecruiterBody {
    job_id: string;
    recruiter_id: string;
    assigned_by?: string;
}

export function registerRoutes(app: FastifyInstance, service: NetworkService) {
    // Recruiter routes
    app.get('/recruiters', async (request: FastifyRequest, reply: FastifyReply) => {
        const recruiters = await service.getAllRecruiters();
        return reply.send({ data: recruiters });
    });

    // Stats route MUST come before :id route to avoid matching "stats" as an ID
    app.get(
        '/recruiters/:id/stats',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const stats = await service.getRecruiterStats(request.params.id);
                return reply.send({ data: stats });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('Recruiter', request.params.id);
                }
                throw error;
            }
        }
    );

    app.get(
        '/recruiters/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const recruiter = await service.getRecruiterById(request.params.id);
                return reply.send({ data: recruiter });
            } catch (error: any) {
                if (error.message.includes('not found')) {
                    throw new NotFoundError('Recruiter', request.params.id);
                }
                throw error;
            }
        }
    );

    app.get(
        '/recruiters/by-user/:userId',
        async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
            const recruiter = await service.getRecruiterByUserId(request.params.userId);
            if (!recruiter) {
                throw new NotFoundError('Recruiter for user', request.params.userId);
            }
            return reply.send({ data: recruiter });
        }
    );

    app.post(
        '/recruiters',
        async (request: FastifyRequest<{ Body: CreateRecruiterBody }>, reply: FastifyReply) => {
            const { user_id, bio } = request.body;

            if (!user_id) {
                throw new BadRequestError('user_id is required');
            }

            const recruiter = await service.createRecruiter(user_id, bio);
            return reply.status(201).send({ data: recruiter });
        }
    );

    app.patch(
        '/recruiters/:id/status',
        async (
            request: FastifyRequest<{ Params: { id: string }; Body: UpdateRecruiterStatusBody }>,
            reply: FastifyReply
        ) => {
            const { status } = request.body;

            if (!status) {
                throw new BadRequestError('status is required');
            }

            const recruiter = await service.updateRecruiterStatus(request.params.id, status);
            return reply.send({ data: recruiter });
        }
    );

    // Role assignment routes
    app.get(
        '/recruiters/:recruiterId/jobs',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const jobIds = await service.getAssignedJobsForRecruiter(request.params.recruiterId);
            return reply.send({ data: jobIds });
        }
    );

    app.get(
        '/jobs/:jobId/recruiters',
        async (request: FastifyRequest<{ Params: { jobId: string } }>, reply: FastifyReply) => {
            const recruiterIds = await service.getAssignedRecruitersForJob(request.params.jobId);
            return reply.send({ data: recruiterIds });
        }
    );

    app.post('/assignments', async (request: FastifyRequest<{ Body: AssignRecruiterBody }>, reply: FastifyReply) => {
        const { job_id, recruiter_id, assigned_by } = request.body;

        if (!job_id || !recruiter_id) {
            throw new BadRequestError('job_id and recruiter_id are required');
        }

        try {
            const assignment = await service.assignRecruiterToJob(job_id, recruiter_id, assigned_by);
            return reply.status(201).send({ data: assignment });
        } catch (error: any) {
            if (error.message.includes('not active')) {
                throw new BadRequestError(error.message);
            }
            throw error;
        }
    });

    app.delete(
        '/assignments',
        async (
            request: FastifyRequest<{ Querystring: { job_id: string; recruiter_id: string } }>,
            reply: FastifyReply
        ) => {
            const { job_id, recruiter_id } = request.query;

            if (!job_id || !recruiter_id) {
                throw new BadRequestError('job_id and recruiter_id are required');
            }

            await service.unassignRecruiterFromJob(job_id, recruiter_id);
            return reply.status(204).send();
        }
    );

    // Access check route
    app.get(
        '/access-check',
        async (
            request: FastifyRequest<{ Querystring: { user_id: string; job_id: string } }>,
            reply: FastifyReply
        ) => {
            const { user_id, job_id } = request.query;

            if (!user_id || !job_id) {
                throw new BadRequestError('user_id and job_id are required');
            }

            const hasAccess = await service.canUserAccessJob(user_id, job_id);
            return reply.send({ data: { has_access: hasAccess } });
        }
    );
}
