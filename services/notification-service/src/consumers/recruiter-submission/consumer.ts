/**
 * Recruiter Submission Event Consumer
 * Handles notifications for recruiter-initiated opportunity proposals and candidate responses
 */

import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { RecruiterSubmissionEmailService } from '../../services/recruiter-submission/service';
import { ServiceRegistry } from '../../clients';

export class RecruiterSubmissionEventConsumer {
    constructor(
        private emailService: RecruiterSubmissionEmailService,
        private services: ServiceRegistry,
        private logger: Logger
    ) {}

    /**
     * Handle application.recruiter_proposed event
     * Sends notification to candidate about new opportunity
     */
    async handleRecruiterProposedJob(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, recruiter_pitch } = event.payload;

            this.logger.info(
                { application_id, job_id, recruiter_id },
                'Fetching data for recruiter proposed job notification'
            );

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile to get name and email
            const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

            // Build opportunity URL
            const portalUrl = process.env.PORTAL_URL || 'http://localhost:3001';
            const opportunityUrl = `${portalUrl}/opportunities/${application_id}`;

            // Calculate expiry date (7 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            // Send notification to candidate
            await this.emailService.sendNewOpportunityNotification(candidate.email, {
                candidateName: candidate.full_name,
                recruiterName: recruiterUser.full_name || recruiterUser.email,
                jobTitle: job.title,
                companyName: job.company?.name || 'the company',
                jobDescription: job.description,
                recruiterPitch: recruiter_pitch,
                opportunityUrl,
                expiresAt: formattedExpiryDate,
                userId: candidate_id,
                applicationId: application_id,
            });

            this.logger.info(
                { application_id, recipient: candidate.email },
                'New opportunity notification sent to candidate'
            );
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send new opportunity notification'
            );
            throw error;
        }
    }

    /**
     * Handle application.recruiter_approved event
     * Sends notification to recruiter when candidate approves opportunity
     */
    async handleCandidateApprovedOpportunity(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id } = event.payload;

            this.logger.info(
                { application_id, recruiter_id },
                'Fetching data for candidate approved opportunity notification'
            );

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile
            const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

            // Build application URL
            const portalUrl = process.env.PORTAL_URL || 'http://localhost:3001';
            const applicationUrl = `${portalUrl}/applications/${application_id}`;

            // Send notification to recruiter
            await this.emailService.sendCandidateApprovedNotification(recruiterUser.email, {
                candidateName: candidate.full_name,
                recruiterName: recruiterUser.full_name || recruiterUser.email,
                jobTitle: job.title,
                companyName: job.company?.name || 'the company',
                candidateEmail: candidate.email,
                applicationUrl,
                userId: recruiter.user_id,
                applicationId: application_id,
            });

            this.logger.info(
                { application_id, recipient: recruiterUser.email },
                'Candidate approved notification sent to recruiter'
            );
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send candidate approved notification'
            );
            throw error;
        }
    }

    /**
     * Handle application.recruiter_declined event
     * Sends notification to recruiter when candidate declines opportunity
     */
    async handleCandidateDeclinedOpportunity(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, decline_reason, candidate_notes } = event.payload;

            this.logger.info(
                { application_id, recruiter_id },
                'Fetching data for candidate declined opportunity notification'
            );

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile
            const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

            // Build roles browser URL
            const portalUrl = process.env.PORTAL_URL || 'http://localhost:3001';
            const rolesUrl = `${portalUrl}/roles`;

            // Send notification to recruiter
            await this.emailService.sendCandidateDeclinedNotification(recruiterUser.email, {
                candidateName: candidate.full_name,
                recruiterName: recruiterUser.full_name || recruiterUser.email,
                jobTitle: job.title,
                companyName: job.company?.name || 'the company',
                declineReason: decline_reason,
                candidateNotes: candidate_notes,
                othersSourceUrl: rolesUrl,
                userId: recruiter.user_id,
                applicationId: application_id,
            });

            this.logger.info(
                { application_id, recipient: recruiterUser.email },
                'Candidate declined notification sent to recruiter'
            );
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send candidate declined notification'
            );
            throw error;
        }
    }

    /**
     * Handle opportunity expiration (if needed)
     * Optional: sends notification to candidate when opportunity expires
     */
    async handleOpportunityExpired(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id } = event.payload;

            this.logger.info(
                { application_id },
                'Fetching data for opportunity expired notification'
            );

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile
            const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

            // Build explore URL
            const portalUrl = process.env.PORTAL_URL || 'http://localhost:3001';
            const exploreUrl = `${portalUrl}/opportunities`;

            // Send notification to candidate
            await this.emailService.sendOpportunityExpiredNotification(candidate.email, {
                candidateName: candidate.full_name,
                recruiterName: recruiterUser.full_name || recruiterUser.email,
                jobTitle: job.title,
                companyName: job.company?.name || 'the company',
                exploreUrl,
                userId: candidate_id,
                applicationId: application_id,
            });

            this.logger.info(
                { application_id, recipient: candidate.email },
                'Opportunity expired notification sent to candidate'
            );
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send opportunity expired notification'
            );
            throw error;
        }
    }
}
