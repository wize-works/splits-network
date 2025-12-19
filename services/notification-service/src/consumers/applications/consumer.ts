import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { ApplicationsEmailService } from '../../services/applications/service';
import { ServiceRegistry } from '../../clients';

export class ApplicationsEventConsumer {
    constructor(
        private emailService: ApplicationsEmailService,
        private services: ServiceRegistry,
        private logger: Logger
    ) {}

    async handleApplicationCreated(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id } = event.payload;

            this.logger.info({ application_id, job_id, candidate_id }, 'Fetching data for application created notification');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile to get email
            const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const user = userResponse.data || userResponse;

            // Send email notification
            await this.emailService.sendApplicationCreated(user.email, {
                candidateName: candidate.full_name,
                jobTitle: job.title,
                companyName: job.company?.name || 'Unknown Company',
                userId: recruiter.user_id,
            });

            this.logger.info(
                { application_id, recipient: user.email },
                'Application created notification sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send application created notification'
            );
            throw error;
        }
    }

    async handleApplicationAccepted(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, company_id, accepted_by_user_id } = event.payload;

            this.logger.info(
                { application_id, job_id, recruiter_id },
                'Fetching data for application accepted notification'
            );

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            if (recruiter_id) {
                // Fetch recruiter details
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                // Fetch recruiter's user profile to get email
                const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const user = userResponse.data || userResponse;

                // Send email notification to recruiter
                await this.emailService.sendApplicationAccepted(user.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || 'the company',
                    userId: recruiter.user_id,
                });

                this.logger.info(
                    { application_id, recipient: user.email },
                    'Application accepted notification sent to recruiter'
                );
            }
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send application accepted notification'
            );
            throw error;
        }
    }

    async handleApplicationStageChanged(event: DomainEvent): Promise<void> {
        try {
            const { application_id, old_stage, new_stage, job_id, candidate_id } = event.payload;

            this.logger.info(
                { application_id, old_stage, new_stage },
                'Fetching data for stage changed notification'
            );

            // Fetch application to get recruiter ID
            const applicationResponse = await this.services.getAtsService().get<any>(`/applications/${application_id}`);
            const application = applicationResponse.data || applicationResponse;

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id || application.job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id || application.candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            if (application.recruiter_id) {
                // Fetch recruiter details
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${application.recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                // Fetch recruiter's user profile
                const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const user = userResponse.data || userResponse;

                // Send email notification
                await this.emailService.sendApplicationStageChanged(user.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    oldStage: old_stage || 'Unknown',
                    newStage: new_stage,
                    userId: recruiter.user_id,
                });

                this.logger.info(
                    { application_id, recipient: user.email },
                    'Application stage changed notification sent'
                );
            }
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send application stage changed notification'
            );
            throw error;
        }
    }

    /**
     * Handle application submitted by candidate (either to recruiter or company)
     */
    async handleCandidateApplicationSubmitted(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, has_recruiter, stage } = event.payload;

            this.logger.info({ application_id, has_recruiter }, 'Handling candidate application submission');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Get candidate's user profile for email
            const candidateUserResponse = await this.services.getIdentityService().get<any>(`/users/by-email/${candidate.email}`);
            const candidateUser = candidateUserResponse.data || candidateUserResponse;

            // Determine next steps message
            const nextSteps = has_recruiter
                ? 'Your application has been sent to your recruiter for review. They will enhance and submit it to the company.'
                : 'Your application has been submitted directly to the company. They will review and contact you if interested.';

            // Send confirmation email to candidate
            await this.emailService.sendCandidateApplicationSubmitted(candidate.email, {
                candidateName: candidate.full_name,
                jobTitle: job.title,
                companyName: job.company?.name || 'Unknown Company',
                hasRecruiter: has_recruiter,
                nextSteps,
                userId: candidateUser?.id,
            });

            // If has recruiter, notify recruiter
            if (has_recruiter && recruiter_id) {
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

                await this.emailService.sendRecruiterApplicationPending(recruiterUser.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || 'Unknown Company',
                    applicationId: application_id,
                    userId: recruiter.user_id,
                });
            }

            // If submitted directly to company (no recruiter), notify company
            if (!has_recruiter && stage === 'submitted') {
                // Get company admin(s) for notification
                const companyResponse = await this.services.getAtsService().get<any>(`/companies/${job.company_id}`);
                const company = companyResponse.data || companyResponse;

                if (company.identity_organization_id) {
                    // Get organization admins from identity service
                    const membershipsResponse = await this.services.getIdentityService().get<any>(
                        `/organizations/${company.identity_organization_id}/memberships?role=admin`
                    );
                    const memberships = membershipsResponse.data || membershipsResponse;

                    // Notify each admin
                    for (const membership of Array.isArray(memberships) ? memberships : []) {
                        const userResponse = await this.services.getIdentityService().get<any>(`/users/${membership.user_id}`);
                        const user = userResponse.data || userResponse;

                        await this.emailService.sendCompanyApplicationReceived(user.email, {
                            candidateName: candidate.full_name,
                            jobTitle: job.title,
                            applicationId: application_id,
                            hasRecruiter: false,
                            userId: user.id,
                        });
                    }
                }
            }

            this.logger.info({ application_id }, 'Candidate application submission notifications sent');
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send candidate application submission notifications'
            );
            throw error;
        }
    }

    /**
     * Handle recruiter submitting application to company
     */
    async handleRecruiterSubmittedToCompany(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, company_id } = event.payload;

            this.logger.info({ application_id }, 'Handling recruiter submission to company');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;
            const recruiterName = `${recruiterUser.first_name || ''} ${recruiterUser.last_name || ''}`.trim();

            // Get company admins
            const companyResponse = await this.services.getAtsService().get<any>(`/companies/${company_id || job.company_id}`);
            const company = companyResponse.data || companyResponse;

            if (company.identity_organization_id) {
                const membershipsResponse = await this.services.getIdentityService().get<any>(
                    `/organizations/${company.identity_organization_id}/memberships?role=admin`
                );
                const memberships = membershipsResponse.data || membershipsResponse;

                // Notify each admin
                for (const membership of Array.isArray(memberships) ? memberships : []) {
                    const userResponse = await this.services.getIdentityService().get<any>(`/users/${membership.user_id}`);
                    const user = userResponse.data || userResponse;

                    await this.emailService.sendCompanyApplicationReceived(user.email, {
                        candidateName: candidate.full_name,
                        jobTitle: job.title,
                        applicationId: application_id,
                        hasRecruiter: true,
                        recruiterName: recruiterName,
                        userId: user.id,
                    });
                }
            }

            // Also send confirmation to candidate
            const candidateUserResponse = await this.services.getIdentityService().get<any>(`/users/by-email/${candidate.email}`);
            const candidateUser = candidateUserResponse.data || candidateUserResponse;

            await this.emailService.sendCandidateApplicationSubmitted(candidate.email, {
                candidateName: candidate.full_name,
                jobTitle: job.title,
                companyName: job.company?.name || 'Unknown Company',
                hasRecruiter: true,
                nextSteps: 'Your recruiter has reviewed and submitted your application to the company. They will be in touch if there is interest.',
                userId: candidateUser?.id,
            });

            this.logger.info({ application_id }, 'Recruiter submission to company notifications sent');
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send recruiter submission notifications'
            );
            throw error;
        }
    }

    /**
     * Handle application withdrawal
     */
    async handleApplicationWithdrawn(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, reason } = event.payload;

            this.logger.info({ application_id }, 'Handling application withdrawal');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Notify recruiter if exists
            if (recruiter_id) {
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const user = userResponse.data || userResponse;

                await this.emailService.sendApplicationWithdrawn(user.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    reason,
                    userId: recruiter.user_id,
                });
            }

            // Notify company admins
            const companyResponse = await this.services.getAtsService().get<any>(`/companies/${job.company_id}`);
            const company = companyResponse.data || companyResponse;

            if (company.identity_organization_id) {
                const membershipsResponse = await this.services.getIdentityService().get<any>(
                    `/organizations/${company.identity_organization_id}/memberships?role=admin`
                );
                const memberships = membershipsResponse.data || membershipsResponse;

                for (const membership of Array.isArray(memberships) ? memberships : []) {
                    const userResponse = await this.services.getIdentityService().get<any>(`/users/${membership.user_id}`);
                    const user = userResponse.data || userResponse;

                    await this.emailService.sendApplicationWithdrawn(user.email, {
                        candidateName: candidate.full_name,
                        jobTitle: job.title,
                        reason,
                        userId: user.id,
                    });
                }
            }

            this.logger.info({ application_id }, 'Application withdrawal notifications sent');
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send application withdrawal notifications'
            );
            throw error;
        }
    }

    async handlePreScreenRequested(event: DomainEvent): Promise<void> {
        try {
            const {
                application_id,
                job_id,
                candidate_id,
                company_id,
                recruiter_id,
                requested_by_user_id,
                message,
                auto_assign,
            } = event.payload;

            this.logger.info({ application_id, recruiter_id, auto_assign }, 'Processing pre-screen request notification');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch company details
            const companyResponse = await this.services.getAtsService().get<any>(`/companies/${company_id}`);
            const company = companyResponse.data || companyResponse;

            // Fetch requesting user details
            const requestingUserResponse = await this.services.getIdentityService().get<any>(`/users/${requested_by_user_id}`);
            const requestingUser = requestingUserResponse.data || requestingUserResponse;

            // Send notification to recruiter (if specified)
            if (recruiter_id && !auto_assign) {
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const user = userResponse.data || userResponse;

                await this.emailService.sendPreScreenRequested(user.email, {
                    candidateName: candidate.full_name,
                    candidateEmail: candidate.email,
                    jobTitle: job.title,
                    companyName: company.name,
                    requestedBy: requestingUser.full_name || requestingUser.email,
                    message: message || '',
                    userId: recruiter.user_id,
                });

                this.logger.info({ recruiter_id, recipient: user.email }, 'Pre-screen request notification sent to recruiter');
            }

            // If auto-assign, we don't send notification yet - wait for actual assignment
            if (auto_assign) {
                this.logger.info({ application_id }, 'Pre-screen request is auto-assign, skipping notification');
            }

            // Send confirmation to requesting user
            await this.emailService.sendPreScreenRequestConfirmation(requestingUser.email, {
                candidateName: candidate.full_name,
                jobTitle: job.title,
                autoAssign: auto_assign,
                userId: requested_by_user_id,
            });

            this.logger.info({ application_id }, 'Pre-screen request notifications completed');
        } catch (error) {
            this.logger.error(
                { error, event_payload: event.payload },
                'Failed to send pre-screen request notifications'
            );
            throw error;
        }
    }
}
