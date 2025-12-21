import { FastifyInstance } from 'fastify';
import { AIReviewService } from '../services/ai-review';
import { ApplicationService } from '../services/applications/service';
import { CandidateService } from '../services/candidates/service';
import { AtsRepository } from '../repository';
import { EventPublisher } from '../events';

export async function aiReviewRoutes(
    fastify: FastifyInstance,
    repository: AtsRepository,
    eventPublisher: EventPublisher
) {
    const aiReviewService = new AIReviewService(repository, eventPublisher);
    const candidateService = new CandidateService(repository);
    const applicationService = new ApplicationService(repository, eventPublisher, candidateService);

    /**
     * POST /api/applications/:id/ai-review
     * Trigger AI review for an application
     */
    fastify.post<{
        Params: { id: string };
        Body: {
            resume_text?: string;
            force?: boolean; // Allow re-review
            auto_transition?: boolean; // Auto-transition to next stage after review (default: true)
        };
    }>('/applications/:id/ai-review', async (request, reply) => {
        const { id: applicationId } = request.params;
        const { resume_text, force, auto_transition = true } = request.body;

        try {
            // Check if application exists
            const applications = await repository.findApplications({ candidate_id: '', job_id: '' });
            const application = applications.find(a => a.id === applicationId);
            
            if (!application) {
                return reply.status(404).send({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Application not found'
                    }
                });
            }

            // Check if already reviewed (unless force=true)
            if (application.ai_reviewed && !force) {
                const existingReview = await aiReviewService.getAIReview(applicationId);
                return reply.send({
                    data: existingReview,
                    message: 'Application already reviewed. Use force=true to re-review.'
                });
            }

            // Get job and candidate details
            const job = await repository.findJobById(application.job_id);
            const candidate = await repository.findCandidateById(application.candidate_id);

            if (!job) {
                return reply.status(404).send({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Job not found'
                    }
                });
            }

            if (!candidate) {
                return reply.status(404).send({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Candidate not found'
                    }
                });
            }

            // Get job requirements (enriched data)
            const requirements = job.requirements || [];
            const mandatorySkills = requirements
                .filter(r => r.requirement_type === 'mandatory')
                .map(r => r.description);
            const preferredSkills = requirements
                .filter(r => r.requirement_type === 'preferred')
                .map(r => r.description);

            // Build resume text from candidate profile if not provided
            const resumeContent = resume_text || [
                candidate.full_name,
                candidate.current_title ? `Current: ${candidate.current_title}` : '',
                candidate.current_company ? `at ${candidate.current_company}` : '',
                candidate.location ? `Location: ${candidate.location}` : '',
                candidate.bio || '',
                candidate.skills ? `Skills: ${candidate.skills}` : '',
            ].filter(Boolean).join('\n');

            // Trigger AI review
            const review = await aiReviewService.reviewApplication({
                application_id: applicationId,
                resume_text: resumeContent,
                job_description: job.recruiter_description || job.description || '',
                job_title: job.title,
                required_skills: mandatorySkills,
                preferred_skills: preferredSkills,
                required_years: undefined, // TODO: Parse from requirements
                candidate_location: candidate.location,
                job_location: job.location,
                auto_transition,
            });

            // If auto_transition is enabled, move application to next stage
            if (auto_transition && application.stage === 'ai_review') {
                await applicationService.handleAIReviewCompleted(applicationId, review.fit_score);
            }

            return reply.send({ data: review });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: {
                    code: 'AI_REVIEW_FAILED',
                    message: error instanceof Error ? error.message : 'AI review failed'
                }
            });
        }
    });

    /**
     * POST /api/applications/:id/complete-draft
     * Complete application draft and trigger AI review
     */
    fastify.post<{
        Params: { id: string };
        Body: {
            user_id: string;
        };
    }>('/applications/:id/complete-draft', async (request, reply) => {
        const { id: applicationId } = request.params;
        const { user_id } = request.body;

        if (!user_id) {
            return reply.status(400).send({
                error: {
                    code: 'MISSING_USER_ID',
                    message: 'user_id is required'
                }
            });
        }

        try {
            // Complete draft (transitions to ai_review stage)
            const application = await applicationService.completeApplicationDraft(applicationId, user_id);

            // Automatically trigger AI review
            const applications = await repository.findApplications({ candidate_id: '', job_id: '' });
            const app = applications.find(a => a.id === applicationId);

            if (app) {
                const job = await repository.findJobById(app.job_id);
                const candidate = await repository.findCandidateById(app.candidate_id);

                if (job && candidate) {
                    const requirements = job.requirements || [];
                    const mandatorySkills = requirements
                        .filter(r => r.requirement_type === 'mandatory')
                        .map(r => r.description);
                    const preferredSkills = requirements
                        .filter(r => r.requirement_type === 'preferred')
                        .map(r => r.description);

                    const resumeContent = [
                        candidate.full_name,
                        candidate.current_title ? `Current: ${candidate.current_title}` : '',
                        candidate.current_company ? `at ${candidate.current_company}` : '',
                        candidate.location ? `Location: ${candidate.location}` : '',
                        candidate.bio || '',
                        candidate.skills ? `Skills: ${candidate.skills}` : '',
                    ].filter(Boolean).join('\n');

                    // Trigger AI review in background (fire and forget)
                    aiReviewService.reviewApplication({
                        application_id: applicationId,
                        resume_text: resumeContent,
                        job_description: job.recruiter_description || job.description || '',
                        job_title: job.title,
                        required_skills: mandatorySkills,
                        preferred_skills: preferredSkills,
                        candidate_location: candidate.location,
                        job_location: job.location,
                        auto_transition: true,
                    }).then(review => {
                        // Auto-transition after review completes
                        return applicationService.handleAIReviewCompleted(applicationId, review.fit_score);
                    }).catch(err => {
                        fastify.log.error({ err, applicationId }, 'AI review failed after draft completion');
                    });
                }
            }

            return reply.send({ data: application });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: {
                    code: 'DRAFT_COMPLETION_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to complete draft'
                }
            });
        }
    });

    /**
     * GET /api/applications/:id/ai-review
     * Get AI review for an application
     */
    fastify.get<{
        Params: { id: string };
    }>('/applications/:id/ai-review', async (request, reply) => {
        const { id: applicationId } = request.params;

        try {
            const review = await aiReviewService.getAIReview(applicationId);

            if (!review) {
                return reply.status(404).send({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'AI review not found for this application'
                    }
                });
            }

            return reply.send({ data: review });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch AI review'
                }
            });
        }
    });

    /**
     * GET /api/jobs/:jobId/ai-review-stats
     * Get AI review statistics for a job
     */
    fastify.get<{
        Params: { jobId: string };
    }>('/jobs/:jobId/ai-review-stats', async (request, reply) => {
        const { jobId } = request.params;

        try {
            // Verify job exists
            const job = await repository.findJobById(jobId);
            if (!job) {
                return reply.status(404).send({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Job not found'
                    }
                });
            }

            const stats = await aiReviewService.getAIReviewStats(jobId);

            return reply.send({ data: stats });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to fetch AI review statistics'
                }
            });
        }
    });
}
