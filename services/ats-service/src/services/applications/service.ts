import { AtsRepository } from '../../repository';
import { EventPublisher } from '../../events';
import { Application, Candidate, MaskedCandidate, ApplicationStage } from '@splits-network/shared-types';
import { CandidateService } from '../candidates/service';
import { getNetworkClient } from '../../clients/network-client';

export class ApplicationService {
    private networkClient = getNetworkClient();
    
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

    /**
     * Resolve entity ID for the authenticated user.
     * For recruiters: Calls Network Service to get recruiter profile and returns recruiter.id
     * For others (candidates, companies): Returns the clerkUserId directly
     * Returns null if user is inactive
     */
    async resolveEntityId(
        clerkUserId: string,
        userRole: 'candidate' | 'recruiter' | 'company' | 'admin',
        correlationId?: string
    ): Promise<string | null> {
        if (userRole === 'recruiter') {
            console.log('[ApplicationService] Resolving recruiter entity ID for Clerk user:', clerkUserId);
            
            const recruiter = await this.networkClient.getRecruiterByClerkUserId(clerkUserId);
            
            if (!recruiter) {
                console.log('[ApplicationService] Recruiter not found or inactive');
                return null;
            }
            
            console.log('[ApplicationService] Resolved to recruiter_id:', recruiter.id);
            return recruiter.id;
        }
        
        // For candidates/companies/admins, the entity ID is the user ID
        return clerkUserId;
    }

    async getApplicationsPaginated(params: {
        clerkUserId?: string;
        userRole?: 'candidate' | 'recruiter' | 'company' | 'admin';
        page?: number;
        limit?: number;
        search?: string;
        stage?: string;
        job_id?: string;
        job_ids?: string[];
        candidate_id?: string;
        company_id?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }, correlationId?: string): Promise<{
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
        // If clerkUserId and userRole provided, resolve entity ID
        let recruiter_id: string | undefined;
        
        if (params.clerkUserId && params.userRole) {
            const entityId = await this.resolveEntityId(params.clerkUserId, params.userRole, correlationId);
            
            if (!entityId && params.userRole === 'recruiter') {
                // Inactive recruiter - return empty results
                console.log('[ApplicationService] Inactive recruiter, returning empty results');
                return {
                    data: [],
                    total: 0,
                    page: params.page || 1,
                    limit: params.limit || 25,
                    total_pages: 0,
                };
            }
            
            // For recruiters, use the resolved recruiter_id for filtering
            if (params.userRole === 'recruiter' && entityId) {
                recruiter_id = entityId;
            }
        }
        
        // Build repository query params (now with resolved recruiter_id if applicable)
        const repositoryParams = {
            page: params.page,
            limit: params.limit,
            search: params.search,
            stage: params.stage,
            recruiter_id: recruiter_id, // Use resolved recruiter_id
            job_id: params.job_id,
            job_ids: params.job_ids,
            candidate_id: params.candidate_id,
            company_id: params.company_id,
            sort_by: params.sort_by,
            sort_order: params.sort_order,
        };
        
        return await this.repository.findApplicationsPaginated(repositoryParams);
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

    /**
     * Recruiter proposes job opportunity to candidate
     * Creates application in 'recruiter_proposed' stage
     * Candidate must approve before proceeding to application completion
     */
    async recruiterProposeJob(params: {
        recruiterId: string;
        recruiterUserId: string;
        candidateId: string;
        jobId: string;
        pitch?: string; // Optional note from recruiter
    }): Promise<Application> {
        const { recruiterId, recruiterUserId, candidateId, jobId, pitch } = params;

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

        // 3. Check recruiter has active relationship with candidate
        // This would be checked against network service
        // For now, we assume this is validated at gateway level
        // TODO: Add network service call to validate relationship

        // 4. Check for existing active application (prevent duplicates)
        const existingApplications = await this.repository.findApplications({
            job_id: jobId,
            candidate_id: candidateId,
        });

        const activeApplications = existingApplications.filter(
            app => !['rejected', 'withdrawn'].includes(app.stage)
        );

        if (activeApplications.length > 0) {
            throw new Error(`Candidate already has an active application for this job`);
        }

        // 5. Create application in recruiter_proposed stage
        const application = await this.repository.createApplication({
            job_id: jobId,
            candidate_id: candidateId,
            recruiter_id: recruiterId,
            stage: 'recruiter_proposed',
            recruiter_notes: pitch,
            accepted_by_company: false,
            ai_reviewed: false,
        });

        // 6. Create audit log entry
        await this.repository.createAuditLog({
            application_id: application.id,
            action: 'recruiter_proposed_job',
            performed_by_user_id: recruiterUserId,
            performed_by_role: 'recruiter',
            new_value: {
                stage: 'recruiter_proposed',
                recruiter_pitch: pitch,
            },
            metadata: {
                job_id: jobId,
                candidate_id: candidateId,
                recruiter_id: recruiterId,
            },
        });

        // 7. Publish event
        await this.eventPublisher.publish(
            'application.recruiter_proposed',
            {
                application_id: application.id,
                recruiter_id: recruiterId,
                recruiter_user_id: recruiterUserId,
                candidate_id: candidateId,
                candidate_email: candidate.email,
                candidate_name: candidate.full_name,
                job_id: jobId,
                job_title: job.title,
                company_id: job.company_id,
                recruiter_pitch: pitch,
            },
            'ats-service'
        );

        return application;
    }

    /**
     * Candidate approves job opportunity
     * Moves application from 'recruiter_proposed' to 'draft'
     * Candidate will then complete application form
     */
    async candidateApproveOpportunity(params: {
        applicationId: string;
        candidateId: string;
        candidateUserId: string;
    }): Promise<Application> {
        const { applicationId, candidateId, candidateUserId } = params;

        // 1. Get application
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        // 2. Verify application is in recruiter_proposed stage
        if (application.stage !== 'recruiter_proposed') {
            throw new Error(`Application is not in recruiter_proposed stage (current: ${application.stage})`);
        }

        // 3. Verify user is the candidate for this application
        if (application.candidate_id !== candidateId) {
            throw new Error('You can only respond to opportunities sent to you');
        }

        // 4. Verify job is still active
        const job = await this.repository.findJobById(application.job_id);
        if (!job) {
            throw new Error(`Job ${application.job_id} not found`);
        }
        if (job.status !== 'active') {
            throw new Error('This job is no longer accepting applications');
        }

        // 5. Update application stage to draft
        const updated = await this.repository.updateApplication(applicationId, {
            stage: 'draft',
        });

        // 6. Create audit log entry
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'candidate_approved_opportunity',
            performed_by_user_id: candidateUserId,
            performed_by_role: 'candidate',
            old_value: {
                stage: 'recruiter_proposed',
            },
            new_value: {
                stage: 'draft',
            },
        });

        // 7. Publish event
        await this.eventPublisher.publish(
            'application.candidate_approved',
            {
                application_id: applicationId,
                candidate_id: candidateId,
                recruiter_id: application.recruiter_id,
                job_id: application.job_id,
                approved_at: new Date().toISOString(),
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Candidate declines job opportunity
     * Moves application from 'recruiter_proposed' to 'rejected'
     * Ends that specific opportunity (relationship continues)
     */
    async candidateDeclineOpportunity(params: {
        applicationId: string;
        candidateId: string;
        candidateUserId: string;
        reason?: string; // Decline reason code
        notes?: string; // Additional details
    }): Promise<Application> {
        const { applicationId, candidateId, candidateUserId, reason, notes } = params;

        // 1. Get application
        const application = await this.repository.findApplicationById(applicationId);
        if (!application) {
            throw new Error(`Application ${applicationId} not found`);
        }

        // 2. Verify application is in recruiter_proposed stage
        if (application.stage !== 'recruiter_proposed') {
            throw new Error(`Application is not in recruiter_proposed stage (current: ${application.stage})`);
        }

        // 3. Verify user is the candidate for this application
        if (application.candidate_id !== candidateId) {
            throw new Error('You can only respond to opportunities sent to you');
        }

        // 4. Update application stage to rejected
        const updated = await this.repository.updateApplication(applicationId, {
            stage: 'rejected',
        });

        // 5. Create audit log entry with decline reason
        await this.repository.createAuditLog({
            application_id: applicationId,
            action: 'candidate_declined_opportunity',
            performed_by_user_id: candidateUserId,
            performed_by_role: 'candidate',
            old_value: {
                stage: 'recruiter_proposed',
            },
            new_value: {
                stage: 'rejected',
                decline_reason: reason,
                decline_note: notes,
            },
            metadata: {
                reason,
                notes,
            },
        });

        // 6. Get candidate info for event
        const candidate = await this.repository.findCandidateById(candidateId);

        // 7. Publish event
        await this.eventPublisher.publish(
            'application.candidate_declined',
            {
                application_id: applicationId,
                candidate_id: candidateId,
                candidate_name: candidate?.full_name,
                recruiter_id: application.recruiter_id,
                job_id: application.job_id,
                decline_reason: reason,
                decline_note: notes,
                declined_at: new Date().toISOString(),
            },
            'ats-service'
        );

        return updated;
    }

    /**
     * Get pending opportunities for a candidate
     * Returns all applications in 'recruiter_proposed' stage awaiting their decision
     */
    async getPendingOpportunitiesForCandidate(candidateId: string): Promise<Array<
        Omit<Application, 'job' | 'candidate'> & {
            job: { id: string; title: string; description?: string; location?: string };
            recruiter: { id: string; name?: string; email?: string };
        }
    >> {
        // Get all applications in recruiter_proposed stage for this candidate
        const applications = await this.repository.findApplications({
            candidate_id: candidateId,
            stage: 'recruiter_proposed',
        });

        // Enrich with job and recruiter details
        const enriched = await Promise.all(
            applications.map(async (app) => {
                const job = await this.repository.findJobById(app.job_id);
                if (!job) {
                    throw new Error(`Job ${app.job_id} not found`);
                }

                const recruiter = {
                    id: app.recruiter_id ?? '',
                    name: '',
                    email: '',
                };

                return {
                    ...(app as Omit<Application, 'job' | 'candidate'>),
                    job: {
                        id: job.id,
                        title: job.title,
                        description: job.description,
                        location: job.location,
                    },
                    recruiter,
                };
            })
        );

        return enriched;
    }

    /**
     * Get proposed jobs awaiting candidate response for a recruiter
     * Returns all applications in 'recruiter_proposed' stage the recruiter sent
     */
    async getProposedJobsForRecruiter(recruiterId: string): Promise<Array<
        Omit<Application, 'job' | 'candidate'> & {
            candidate: { id: string; full_name: string; email: string };
            job: { id: string; title: string };
            status: 'pending' | 'approved' | 'declined';
        }
    >> {
        // Get all applications this recruiter proposed
        const applications = await this.repository.findApplications({
            recruiter_id: recruiterId,
        });

        // Filter by stage to determine status
        const enriched = await Promise.all(
            applications.filter(app => ['recruiter_proposed', 'draft', 'rejected'].includes(app.stage))
                .map(async (app) => {
                    const candidate = await this.repository.findCandidateById(app.candidate_id);
                    const job = await this.repository.findJobById(app.job_id);

                    if (!candidate || !job) {
                        throw new Error('Candidate or job not found');
                    }

                    // Determine status based on stage
                    let status: 'pending' | 'approved' | 'declined' = 'pending';
                    if (app.stage === 'draft') {
                        status = 'approved';
                    } else if (app.stage === 'rejected') {
                        status = 'declined';
                    }

                    return {
                        ...(app as Omit<Application, 'job' | 'candidate'>),
                        candidate: {
                            id: candidate.id,
                            full_name: candidate.full_name,
                            email: candidate.email,
                        },
                        job: {
                            id: job.id,
                            title: job.title,
                        },
                        status,
                    };
                })
        );

        return enriched;
    }
}
