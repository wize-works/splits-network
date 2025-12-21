import { AtsRepository } from '../../repository';
import { EventPublisher } from '../../events';
import { Application, Candidate, MaskedCandidate, ApplicationStage } from '@splits-network/shared-types';
import { CandidateService } from '../candidates/service';

export class ApplicationService {
    constructor(
        private repository: AtsRepository,
        private eventPublisher: EventPublisher,
        private candidateService: CandidateService
    ) {}

    async getApplications(filters?: {
        recruiter_id?: string;
        job_id?: string;
        stage?: string
    }): Promise<Application[]> {
        return await this.repository.findApplications(filters);
    }

    async getApplicationsPaginated(params: {
        page?: number;
        limit?: number;
        search?: string;
        stage?: string;
        recruiter_id?: string;
        job_id?: string;
        job_ids?: string[];
        candidate_id?: string;
        company_id?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        data: Array<Application & {
            candidate: { id: string; full_name: string; email: string; linkedin_url?: string; _masked?: boolean };
            job: { id: string; title: string; company_id: string };
            company: { id: string; name: string };
            recruiter?: { id: string; name: string; email: string };
        }>;
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }> {
        return await this.repository.findApplicationsPaginated(params);
    }

    async getApplicationById(id: string): Promise<Application> {
        const application = await this.repository.findApplicationById(id);
        if (!application) {
            throw new Error(`Application ${id} not found`);
        }
        return application;
    }

    async getApplicationsByJobId(jobId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByJobId(jobId);
    }

    async getApplicationsByRecruiterId(recruiterId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByRecruiterId(recruiterId);
    }

    async getApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
        return await this.repository.findApplicationsByCandidateId(candidateId);
    }

    async submitCandidate(
        jobId: string,
        candidateEmail: string,
        candidateName: string,
        recruiterId?: string,
        options: {
            linkedin_url?: string;
            phone?: string;
            location?: string;
            current_title?: string;
            current_company?: string;
            notes?: string;
        } = {}
    ): Promise<Application> {
        // Verify job exists
        const job = await this.repository.findJobById(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        // Find or create candidate (this sets recruiter_id as the sourcer)
        let candidate = await this.candidateService.findOrCreateCandidate(
            candidateEmail,
            candidateName,
            options.linkedin_url,
            recruiterId
        );

        // Update additional fields if provided
        if (options.phone || options.location || options.current_title || options.current_company) {
            candidate = await this.candidateService.updateCandidate(candidate.id, {
                phone: options.phone,
                location: options.location,
                current_title: options.current_title,
                current_company: options.current_company,
            });
        }

        // Create application
        const application = await this.repository.createApplication({
            job_id: jobId,
            candidate_id: candidate.id,
            recruiter_id: recruiterId,
            stage: 'submitted',
            notes: options.notes,
            accepted_by_company: false,
            ai_reviewed: false,
        });

        // Log the submission
        await this.repository.createAuditLog({
            application_id: application.id,
            action: 'created',
            performed_by_user_id: recruiterId,
            performed_by_role: 'recruiter',
            company_id: job.company_id,
            new_value: {
                stage: 'submitted',
                candidate_id: candidate.id,
                job_id: jobId,
            },
            metadata: {
                candidate_email: candidateEmail,
                candidate_name: candidateName,
                linkedin_url: options.linkedin_url,
                notes: options.notes,
            },
        });

        // Publish event - network service will create recruiter_candidates relationship
        await this.eventPublisher.publish(
            'application.created',
            {
                application_id: application.id,
                job_id: jobId,
                candidate_id: candidate.id,
                recruiter_id: recruiterId,
                company_id: job.company_id,
                stage: 'submitted',
                has_recruiter: !!recruiterId,
                candidate_was_created: !candidate.created_at || (new Date().getTime() - new Date(candidate.created_at).getTime() < 1000), // New if created within last second
            },
            'ats-service'
        );

        return application;
    }

    async updateApplicationStage(
        id: string,
        newStage: ApplicationStage,
        notes?: string,
        auditContext?: {
            userId?: string;
            userRole?: string;
            companyId?: string;
        }
    ): Promise<Application> {
        const application = await this.getApplicationById(id);
        const oldStage = application.stage;

        const updated = await this.repository.updateApplication(id, {
            stage: newStage,
            notes: notes || application.notes,
        });

        // Get job to extract company_id for audit log
        const job = await this.repository.findJobById(application.job_id);

        // Log the stage change
        await this.repository.createAuditLog({
            application_id: id,
            action: 'stage_changed',
            performed_by_user_id: auditContext?.userId,
            performed_by_role: auditContext?.userRole,
            company_id: auditContext?.companyId || job?.company_id,
            old_value: { stage: oldStage },
            new_value: { stage: newStage },
            metadata: {
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                notes: notes,
            },
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.stage_changed',
            {
                application_id: id,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                old_stage: oldStage,
                new_stage: newStage,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Add note to application without changing stage
     */
    async addApplicationNote(
        id: string,
        note: string,
        auditContext?: {
            userId?: string;
            userRole?: string;
            companyId?: string;
        }
    ): Promise<Application> {
        const application = await this.getApplicationById(id);

        // Append new note to existing recruiter_notes
        const existingNotes = application.recruiter_notes || '';
        const timestamp = new Date().toISOString();
        const newNoteWithTimestamp = `[${timestamp}] ${note}`;
        const updatedNotes = existingNotes 
            ? `${existingNotes}\n\n${newNoteWithTimestamp}`
            : newNoteWithTimestamp;

        const updated = await this.repository.updateApplication(id, {
            recruiter_notes: updatedNotes,
        });

        // Get job to extract company_id for audit log
        const job = await this.repository.findJobById(application.job_id);

        // Log the note addition
        await this.repository.createAuditLog({
            application_id: id,
            action: 'note_added',
            performed_by_user_id: auditContext?.userId,
            performed_by_role: auditContext?.userRole,
            company_id: auditContext?.companyId || job?.company_id,
            old_value: { recruiter_notes: existingNotes },
            new_value: { recruiter_notes: updatedNotes },
            metadata: {
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                note: note,
            },
        });

        return updated;
    }

    /**
     * Accept a candidate submission - allows company to see full candidate details
     * Logs the acceptance action for audit trail
     */
    async acceptApplication(
        applicationId: string,
        auditContext?: {
            userId?: string;
            userRole?: string;
            companyId?: string;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<Application> {
        const application = await this.getApplicationById(applicationId);

        if (application.accepted_by_company) {
            return application; // Already accepted
        }

        // Get job to extract company_id
        const job = await this.repository.findJobById(application.job_id);
        if (!job) {
            throw new Error(`Job ${application.job_id} not found`);
        }

        const updated = await this.repository.updateApplication(applicationId, {
            accepted_by_company: true,
            accepted_at: new Date(),
        });

        // Log the acceptance action
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'accepted',
            performed_by_user_id: auditContext?.userId,
            performed_by_role: auditContext?.userRole,
            company_id: auditContext?.companyId || job.company_id,
            old_value: {
                accepted_by_company: false,
                accepted_at: null,
            },
            new_value: {
                accepted_by_company: true,
                accepted_at: updated.accepted_at,
            },
            metadata: {
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                stage: application.stage,
            },
            ip_address: auditContext?.ipAddress,
            user_agent: auditContext?.userAgent,
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.accepted',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                company_id: job.company_id,
                accepted_by_user_id: auditContext?.userId,
                accepted_at: updated.accepted_at,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Get applications for a company with proper candidate masking
     * Only shows candidates that have been submitted to company's jobs
     */
    async getApplicationsForCompany(
        companyId: string,
        filters?: { job_id?: string; stage?: string }
    ): Promise<Array<Application & { candidate: Candidate | MaskedCandidate; recruiter?: { id: string; name: string; email: string } }>> {
        // Get all jobs for this company
        const jobs = await this.repository.findJobsByCompanyId(companyId);
        const jobIds = jobs.map(j => j.id);

        if (jobIds.length === 0) {
            return [];
        }

        // Get applications for these jobs
        const applications = await this.repository.findApplications({
            job_ids: jobIds,
            job_id: filters?.job_id,
            stage: filters?.stage,
        });

        // Enrich with candidate and recruiter data, applying masking as needed
        const enriched = await Promise.all(
            applications.map(async (app) => {
                const candidate = await this.repository.findCandidateById(app.candidate_id);
                if (!candidate) {
                    throw new Error(`Candidate ${app.candidate_id} not found`);
                }

                // Mask candidate data if not accepted by company
                const candidateData = app.accepted_by_company 
                    ? candidate 
                    : this.candidateService.maskCandidate(candidate);

                // Get recruiter info if present
                let recruiterInfo = undefined;
                if (app.recruiter_id) {
                    // TODO: Fetch from identity service
                    recruiterInfo = {
                        id: app.recruiter_id,
                        name: 'Recruiter', // Placeholder
                        email: 'recruiter@example.com', // Placeholder
                    };
                }

                return {
                    ...app,
                    candidate: candidateData,
                    recruiter: recruiterInfo,
                };
            })
        );

        return enriched;
    }

    /**
     * Get audit log for an application
     */
    async getApplicationAuditLog(applicationId: string) {
        return await this.repository.getAuditLogsForApplication(applicationId);
    }

    /**
     * Get audit logs for a company
     */
    async getCompanyAuditLogs(companyId: string, limit?: number) {
        return await this.repository.getAuditLogsForCompany(companyId, limit);
    }

    /**
     * Submit candidate-initiated application
     * Handles both direct (no recruiter) and recruiter-represented applications
     */
    async submitCandidateApplication(params: {
        candidateId: string;
        candidateUserId?: string;
        jobId: string;
        documentIds: string[];
        primaryResumeId: string;
        preScreenAnswers?: Array<{ question_id: string; answer: any }>;
        notes?: string;
    }): Promise<{
        application: Application;
        hasRecruiter: boolean;
        nextSteps: string;
    }> {
        const { candidateId, candidateUserId, jobId, documentIds, primaryResumeId, preScreenAnswers, notes } = params;

        // 1. Verify job exists
        const job = await this.repository.findJobById(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        // 2. Verify candidate exists
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error(`Candidate ${candidateId} not found`);
        }

        // 3. Check for existing active application (exclude rejected and withdrawn)
        const existingApplications = await this.repository.findApplications({
            job_id: jobId,
            candidate_id: candidateId,
        });
        
        // Filter out rejected and withdrawn applications
        const activeApplications = existingApplications.filter(
            app => !['rejected', 'withdrawn'].includes(app.stage)
        );
        
        if (activeApplications.length > 0) {
            throw new Error(`Candidate has already applied to this job`);
        }

        // 4. Check if candidate has a recruiter relationship (12-month window)
        // Query database directly for active recruiter relationships
        let hasRecruiter = false;
        let recruiterId: string | undefined = undefined;
        
        try {
            const recruiterRelationship = await this.repository.findActiveRecruiterForCandidate(candidateId);
            console.log('[DEBUG] findActiveRecruiterForCandidate result:', JSON.stringify(recruiterRelationship));
            
            if (recruiterRelationship) {
                // Candidate has an active recruiter relationship
                hasRecruiter = true;
                // IMPORTANT: applications.recruiter_id FK constraint now correctly points to network.recruiters.id
                recruiterId = recruiterRelationship.recruiter_id;
                console.log('[DEBUG] Set recruiterId to:', recruiterId, 'typeof:', typeof recruiterId);
            } else {
                console.log('[DEBUG] No recruiter relationship found for candidateId:', candidateId);
            }
        } catch (error) {
            console.error('Failed to check recruiter relationships:', error);
            // If query fails, default to no recruiter (safer than guessing)
            hasRecruiter = false;
            recruiterId = undefined;
        }

        // 5. Determine initial stage based on recruiter status
        const initialStage: ApplicationStage = hasRecruiter ? 'screen' : 'submitted';

        // Sanitize recruiterId - convert empty string or "0" to undefined for optional field
        const sanitizedRecruiterId = recruiterId && recruiterId !== '0' ? recruiterId : undefined;

        // 6. Create application
        const application = await this.repository.createApplication({
            job_id: jobId,
            candidate_id: candidateId,
            recruiter_id: sanitizedRecruiterId, // network.recruiters.id (undefined if no recruiter)
            stage: initialStage,
            notes: notes,
            accepted_by_company: false,
            ai_reviewed: false,
        });

        // 7. Link documents to application (via documents table with entity pattern)
        if (documentIds && documentIds.length > 0) {
            await Promise.all(
                documentIds.map(async (docId) => {
                    await this.repository.linkDocumentToApplication(
                        docId,
                        application.id,
                        docId === primaryResumeId
                    );
                })
            );
        }

        // 8. Save pre-screen answers
        if (preScreenAnswers && preScreenAnswers.length > 0) {
            await Promise.all(
                preScreenAnswers.map(async (answer) => {
                    await this.repository.createPreScreenAnswer({
                        application_id: application.id,
                        question_id: answer.question_id,
                        answer: answer.answer,
                    });
                })
            );
        }

        // 9. Create audit log entry
        const auditAction = hasRecruiter ? 'submitted_to_recruiter' : 'submitted_to_company';
        await this.repository.createAuditLog({
            application_id: application.id,
            action: auditAction,
            performed_by_user_id: candidateId,
            performed_by_role: 'candidate',
            company_id: job.company_id,
            new_value: {
                stage: initialStage,
                candidate_id: candidateId,
                job_id: jobId,
                recruiter_id: sanitizedRecruiterId, // network.recruiters.id (undefined if no recruiter)
            },
            metadata: {
                document_count: documentIds.length,
                has_pre_screen_answers: !!preScreenAnswers && preScreenAnswers.length > 0,
                notes: notes,
            },
        });

        // 10. Publish event
        const eventPayload = {
            application_id: application.id,
            job_id: jobId,
            candidate_id: candidateId,
            candidate_user_id: candidateUserId, // identity.users.id (from Clerk auth)
            recruiter_id: sanitizedRecruiterId, // network.recruiters.id (undefined if no recruiter)
            company_id: job.company_id,
            stage: initialStage,
            has_recruiter: hasRecruiter,
            document_ids: documentIds,
        };
        
        console.log('[ATS-SERVICE] 📧 Publishing application.created event to RabbitMQ:', {
            event_type: 'application.created',
            payload: eventPayload,
            exchange: 'splits-network-events',
        });
        
        await this.eventPublisher.publish(
            'application.created',
            eventPayload,
            'ats-service'
        );
        
        console.log('[ATS-SERVICE] ✅ Event published successfully');

        // 11. Trigger AI review in background (fire and forget)
        this.triggerAIReviewBackground(application.id, job, candidate).catch(err => {
            console.error('[ATS-SERVICE] AI review failed:', err);
        });

        // 12. Return result with next steps
        const nextSteps = hasRecruiter
            ? 'Your application has been sent to your recruiter for review. They will enhance and submit it to the company.'
            : 'Your application has been submitted directly to the company. They will review and contact you if interested.';

        return {
            application,
            hasRecruiter,
            nextSteps,
        };
    }

    /**
     * Trigger AI review in background (non-blocking)
     */
    private async triggerAIReviewBackground(applicationId: string, job: any, candidate: any): Promise<void> {
        try {
            // Dynamically import AI review service to avoid circular dependencies
            const { AIReviewService } = await import('../ai-review/service');
            const aiReviewService = new AIReviewService(this.repository, this.eventPublisher);

            const requirements = job.requirements || [];
            const mandatorySkills = requirements
                .filter((r: any) => r.requirement_type === 'mandatory')
                .map((r: any) => r.description);
            const preferredSkills = requirements
                .filter((r: any) => r.requirement_type === 'preferred')
                .map((r: any) => r.description);

            const resumeContent = [
                candidate.full_name,
                candidate.current_title ? `Current: ${candidate.current_title}` : '',
                candidate.current_company ? `at ${candidate.current_company}` : '',
                candidate.location ? `Location: ${candidate.location}` : '',
                candidate.bio || '',
                candidate.skills ? `Skills: ${candidate.skills}` : '',
            ].filter(Boolean).join('\n');

            console.log(`[ATS-SERVICE] 🤖 Triggering AI review for application ${applicationId}`);

            // Trigger AI review
            const review = await aiReviewService.reviewApplication({
                application_id: applicationId,
                resume_text: resumeContent,
                job_description: job.recruiter_description || job.description || '',
                job_title: job.title,
                required_skills: mandatorySkills,
                preferred_skills: preferredSkills,
                candidate_location: candidate.location,
                job_location: job.location,
                auto_transition: false, // Don't auto-transition for recruiter review
            });

            console.log(`[ATS-SERVICE] ✅ AI review completed for application ${applicationId}, fit_score: ${review.fit_score}`);

            // Create audit log for AI review
            await this.repository.createAuditLog({
                application_id: applicationId,
                action: 'ai_review_completed',
                performed_by_user_id: 'system',
                performed_by_role: 'system',
                company_id: job.company_id,
                new_value: {
                    ai_reviewed: true,
                    fit_score: review.fit_score,
                    recommendation: review.recommendation,
                },
                metadata: {
                    ai_review_id: review.id,
                    model_version: review.model_version,
                    processing_time_ms: review.processing_time_ms,
                    confidence_level: review.confidence_level,
                },
            });
        } catch (error) {
            console.error(`[ATS-SERVICE] ❌ AI review failed for application ${applicationId}:`, error);
            // Don't throw - this is background processing
        }
    }

    /**
     * Recruiter submits application to company after review
     */
    async recruiterSubmitApplication(
        applicationId: string,
        recruiterId: string,
        options?: {
            recruiterNotes?: string;
        }
    ): Promise<Application> {
        const application = await this.getApplicationById(applicationId);

        // Verify application is in screen stage
        if (application.stage !== 'screen') {
            throw new Error(`Application must be in 'screen' stage to submit to company`);
        }

        // Verify recruiter owns this application
        if (application.recruiter_id !== recruiterId) {
            throw new Error(`Recruiter does not own this application`);
        }

        // Update application stage to submitted and add recruiter notes
        const updated = await this.repository.updateApplication(applicationId, {
            stage: 'submitted',
            recruiter_notes: options?.recruiterNotes,
        });

        // Get job for audit log
        const job = await this.repository.findJobById(application.job_id);

        // Get candidate to include user_id in event
        const candidate = await this.repository.findCandidateById(application.candidate_id);

        // Create audit log
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'submitted_to_company',
            performed_by_user_id: recruiterId,
            performed_by_role: 'recruiter',
            company_id: job?.company_id,
            old_value: { stage: 'screen' },
            new_value: { stage: 'submitted', recruiter_notes: options?.recruiterNotes },
            metadata: {
                job_id: application.job_id,
                candidate_id: application.candidate_id,
            },
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.submitted_to_company',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                candidate_user_id: candidate?.user_id, // identity.users.id - can be undefined if recruiter-managed candidate
                recruiter_id: recruiterId,
                company_id: job?.company_id,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Get pending applications for recruiter review
     */
    async getPendingApplicationsForRecruiter(recruiterId: string): Promise<Application[]> {
        return await this.repository.findApplications({
            recruiter_id: recruiterId,
            stage: 'screen',
        });
    }

    /**
     * Request pre-screen for a direct candidate application
     * Company can assign to specific recruiter or request auto-assignment
     */
    async requestPreScreen(
        applicationId: string,
        companyId: string,
        requestedByUserId: string,
        options: {
            recruiter_id?: string;
            message?: string;
        } = {}
    ): Promise<Application> {
        // Get application and validate
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        // Get job to verify company ownership
        const job = await this.repository.findJobById(application.job_id);
        if (!job) {
            throw new Error(`Job ${application.job_id} not found`);
        }

        if (job.company_id !== companyId) {
            throw new Error('Cannot request pre-screen for application from different company');
        }

        // Validate application is a direct submission (no recruiter yet)
        if (application.recruiter_id) {
            throw new Error('Application already has a recruiter assigned');
        }

        // Validate application is in submitted stage
        if (application.stage !== 'submitted') {
            throw new Error(`Cannot request pre-screen for application in ${application.stage} stage`);
        }

        // Update application with recruiter and change stage to 'screen'
        const updated = await this.repository.updateApplication(applicationId, {
            recruiter_id: options.recruiter_id || undefined,
            stage: 'screen',
        });

        // Create audit log
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'prescreen_requested',
            performed_by_user_id: requestedByUserId,
            performed_by_role: 'company_admin',
            company_id: companyId,
            old_value: {
                stage: 'submitted',
                recruiter_id: null,
            },
            new_value: {
                stage: 'screen',
                recruiter_id: options.recruiter_id || null,
            },
            metadata: {
                message: options.message,
                auto_assign: !options.recruiter_id,
            },
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.prescreen_requested',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                company_id: companyId,
                recruiter_id: options.recruiter_id,
                requested_by_user_id: requestedByUserId,
                message: options.message,
                auto_assign: !options.recruiter_id,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Withdraw application (candidate self-service)
     */
    async withdrawApplication(
        applicationId: string,
        candidateId: string,
        candidateUserId?: string,
        reason?: string
    ): Promise<Application> {
        // Get application and verify it exists
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        // Verify the application belongs to this candidate
        if (application.candidate_id !== candidateId) {
            throw new Error('You can only withdraw your own applications');
        }

        // Verify application is not already withdrawn or rejected
        if (application.stage === 'withdrawn') {
            throw new Error('Application is already withdrawn');
        }

        if (application.stage === 'rejected') {
            throw new Error('Cannot withdraw a rejected application');
        }

        // Get candidate to retrieve user_id (if they have an account)
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error(`Candidate ${candidateId} not found`);
        }

        // Use candidateUserId if provided, otherwise fall back to candidate.user_id
        const finalCandidateUserId = candidateUserId || candidate.user_id;

        // Update application stage to withdrawn
        const updated = await this.repository.updateApplication(applicationId, {
            stage: 'withdrawn',
        });

        // Create audit log
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'withdrawn',
            performed_by_user_id: finalCandidateUserId || candidateId,
            performed_by_role: 'candidate',
            old_value: {
                stage: application.stage,
            },
            new_value: {
                stage: 'withdrawn',
            },
            metadata: {
                reason: reason || 'Candidate withdrew application',
            },
        });

        // Publish event
        await this.eventPublisher.publish(
            'application.withdrawn',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                candidate_user_id: finalCandidateUserId, // identity.users.id (from Clerk auth) - can be undefined if recruiter-managed candidate
                recruiter_id: application.recruiter_id,
                reason: reason || 'Candidate withdrew application',
                previous_stage: application.stage,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Complete application draft and trigger AI review
     * This transitions: draft → ai_review
     */
    async completeApplicationDraft(
        applicationId: string,
        userId: string
    ): Promise<Application> {
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }

        if (application.stage !== 'draft') {
            throw new Error(`Cannot complete draft - application is in ${application.stage} stage`);
        }

        // Transition to ai_review stage
        const updated = await this.repository.updateApplication(applicationId, {
            stage: 'ai_review'
        });

        // Log the transition
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'stage_changed',
            performed_by_user_id: userId,
            metadata: {
                from_stage: 'draft',
                to_stage: 'ai_review',
                reason: 'Application draft completed'
            }
        });

        // Publish event (notification-service will trigger AI review)
        await this.eventPublisher.publish(
            'application.draft_completed',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Handle AI review completion and auto-transition to next stage
     * This transitions: ai_review → screen (represented) or ai_review → submitted (direct)
     */
    async handleAIReviewCompleted(
        applicationId: string,
        fitScore: number
    ): Promise<Application> {
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }

        if (application.stage !== 'ai_review') {
            // Already transitioned, ignore
            return application;
        }

        // Determine next stage based on whether application has recruiter
        const nextStage: ApplicationStage = application.recruiter_id ? 'screen' : 'submitted';

        // Transition to next stage
        const updated = await this.repository.updateApplication(applicationId, {
            stage: nextStage
        });

        // Log the transition
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'stage_changed',
            performed_by_user_id: 'system',
            metadata: {
                from_stage: 'ai_review',
                to_stage: nextStage,
                reason: 'AI review completed',
                ai_fit_score: fitScore
            }
        });

        // Publish stage change event
        await this.eventPublisher.publish(
            'application.stage_changed',
            {
                application_id: applicationId,
                job_id: application.job_id,
                candidate_id: application.candidate_id,
                recruiter_id: application.recruiter_id,
                from_stage: 'ai_review',
                to_stage: nextStage,
                ai_fit_score: fitScore
            },
            'ats-service'
        );

        return updated;
    }
}
