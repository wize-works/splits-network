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
                    applicationId: application_id,
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
                    companyName: job.company?.name || 'Unknown Company',
                    oldStage: old_stage || 'Unknown',
                    newStage: new_stage,
                    applicationId: application_id,
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
            const { application_id, job_id, candidate_id, candidate_user_id, recruiter_id, has_recruiter, stage } = event.payload;

            console.log('[APPLICATIONS-CONSUMER] 🎯 Starting to handle application.created event:', {
                application_id,
                has_recruiter,
                stage,
                candidate_user_id,
                recruiter_id,
            });
            this.logger.info({ application_id, has_recruiter, stage, candidate_user_id }, 'Handling candidate application submission');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Get candidate's user profile for email (may not exist if recruiter sourced the candidate)
            let candidateUser: any = null;
            try {
                // Prefer using candidate_user_id directly (passed from API Gateway via Clerk auth)
                if (candidate_user_id) {
                    const candidateUserResponse = await this.services.getIdentityService().get<any>(`/users/${candidate_user_id}`);
                    candidateUser = candidateUserResponse.data || candidateUserResponse;
                    this.logger.info({ candidate_user_id }, 'Found candidate user via user ID');
                } else {
                    // Fallback: lookup by email (backwards compatibility - will fail until /users/by-email endpoint is added)
                    this.logger.warn({ candidate_id }, 'No candidate_user_id in event payload, cannot send candidate email');
                }
            } catch (error) {
                this.logger.warn({ candidate_id, candidate_user_id, email: candidate.email }, 'Candidate user account not found');
            }

            // Scenario 1: Recruiter directly submits candidate (has_recruiter && stage === 'submitted')
            // This is when a recruiter sources and immediately submits a candidate to a company
            if (has_recruiter && stage === 'submitted') {
                this.logger.info({ application_id }, 'Recruiter direct submission - notifying company');

                // Fetch recruiter details
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;
                const recruiterName = `${recruiterUser.first_name || ''} ${recruiterUser.last_name || ''}`.trim() || recruiterUser.email;

                // Notify company admins
                const companyResponse = await this.services.getAtsService().get<any>(`/companies/${job.company_id}`);
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

                // Also notify the recruiter of successful submission
                await this.emailService.sendApplicationCreated(recruiterUser.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || 'Unknown Company',
                    applicationId: application_id,
                    userId: recruiter.user_id,
                });

                return;
            }

            // Scenario 2: Candidate submits with recruiter (has_recruiter && stage === 'screen')
            // Application goes to recruiter first for review
            if (has_recruiter && stage === 'screen') {
                console.log('[APPLICATIONS-CONSUMER] 📋 Scenario 2: Candidate with recruiter');
                this.logger.info({ application_id }, 'Candidate application with recruiter - notifying candidate and recruiter');

                // Determine next steps message
                const nextSteps = 'Your application has been sent to your recruiter for review. They will enhance and submit it to the company.';

                // Send confirmation email to candidate (if they have an account)
                if (candidateUser) {
                    console.log('[APPLICATIONS-CONSUMER] 📧 Sending email to candidate:', candidate.email);
                    await this.emailService.sendCandidateApplicationSubmitted(candidate.email, {
                        candidateName: candidate.full_name,
                        jobTitle: job.title,
                        companyName: job.company?.name || 'Unknown Company',
                        hasRecruiter: true,
                        nextSteps,
                        applicationId: application_id,
                        userId: candidateUser.id,
                    });
                    console.log('[APPLICATIONS-CONSUMER] ✅ Candidate email sent successfully');
                } else {
                    console.log('[APPLICATIONS-CONSUMER] ⚠️ Skipping candidate email (no user account)');
                }

                // Notify recruiter of pending application
                console.log('[APPLICATIONS-CONSUMER] 🔍 Fetching recruiter details...');
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const recruiterUserResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const recruiterUser = recruiterUserResponse.data || recruiterUserResponse;

                console.log('[APPLICATIONS-CONSUMER] 📧 Sending email to recruiter:', recruiterUser.email);
                await this.emailService.sendRecruiterApplicationPending(recruiterUser.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || 'Unknown Company',
                    applicationId: application_id,
                    userId: recruiter.user_id,
                });
                console.log('[APPLICATIONS-CONSUMER] ✅ Recruiter email sent successfully');
                console.log('[APPLICATIONS-CONSUMER] 🎉 Scenario 2 complete - all notifications sent');

                return;
            }

            // Scenario 3: Candidate submits directly to company (no recruiter, stage === 'submitted')
            if (!has_recruiter && stage === 'submitted') {
                console.log('[APPLICATIONS-CONSUMER] 📋 Scenario 3: Direct to company (no recruiter)');
                this.logger.info({ application_id }, 'Direct candidate application - notifying candidate and company');

                const nextSteps = 'Your application has been submitted directly to the company. They will review and contact you if interested.';

                // Send confirmation email to candidate (if they have an account)
                if (candidateUser) {
                    console.log('[APPLICATIONS-CONSUMER] 📧 Sending email to candidate:', candidate.email);
                    await this.emailService.sendCandidateApplicationSubmitted(candidate.email, {
                        candidateName: candidate.full_name,
                        jobTitle: job.title,
                        companyName: job.company?.name || 'Unknown Company',
                        hasRecruiter: false,
                        nextSteps,
                        applicationId: application_id,
                        userId: candidateUser.id,
                    });
                    console.log('[APPLICATIONS-CONSUMER] ✅ Candidate email sent successfully');
                } else {
                    console.log('[APPLICATIONS-CONSUMER] ⚠️ Skipping candidate email (no user account)');
                }

                // Notify company admins
                console.log('[APPLICATIONS-CONSUMER] 🔍 Fetching company details...');
                const companyResponse = await this.services.getAtsService().get<any>(`/companies/${job.company_id}`);
                const company = companyResponse.data || companyResponse;

                if (company.identity_organization_id) {
                    console.log('[APPLICATIONS-CONSUMER] 🔍 Fetching company admins...');
                    const membershipsResponse = await this.services.getIdentityService().get<any>(
                        `/organizations/${company.identity_organization_id}/memberships?role=admin`
                    );
                    const memberships = membershipsResponse.data || membershipsResponse;
                    console.log(`[APPLICATIONS-CONSUMER] 👥 Found ${Array.isArray(memberships) ? memberships.length : 0} company admins`);

                    // Notify each admin
                    for (const membership of Array.isArray(memberships) ? memberships : []) {
                        const userResponse = await this.services.getIdentityService().get<any>(`/users/${membership.user_id}`);
                        const user = userResponse.data || userResponse;

                        console.log('[APPLICATIONS-CONSUMER] 📧 Sending email to company admin:', user.email);
                        await this.emailService.sendCompanyApplicationReceived(user.email, {
                            candidateName: candidate.full_name,
                            jobTitle: job.title,
                            applicationId: application_id,
                            hasRecruiter: false,
                            userId: user.id,
                        });
                        console.log('[APPLICATIONS-CONSUMER] ✅ Company admin email sent successfully');
                    }
                } else {
                    console.log('[APPLICATIONS-CONSUMER] ⚠️ Company has no identity_organization_id - skipping company admin emails');
                }
                
                console.log('[APPLICATIONS-CONSUMER] 🎉 Scenario 3 complete - all notifications sent');

                return;
            }

            console.log('[APPLICATIONS-CONSUMER] ⚠️ No scenario matched - event details:', { has_recruiter, stage });
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
            const { application_id, job_id, candidate_id, candidate_user_id, recruiter_id, company_id } = event.payload;

            console.log('[NOTIFICATION-SERVICE] 🎯 Handling recruiter submission to company:', {
                application_id,
                candidate_id,
                candidate_user_id,
                has_candidate_user_id: !!candidate_user_id,
            });

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

            // Send confirmation to candidate (only if they have a user account)
            if (candidate_user_id) {
                console.log('[NOTIFICATION-SERVICE] 📧 Fetching candidate user for email:', { candidate_user_id });
                
                try {
                    const candidateUserResponse = await this.services.getIdentityService().get<any>(`/users/${candidate_user_id}`);
                    const candidateUser = candidateUserResponse.data || candidateUserResponse;

                    if (candidateUser) {
                        console.log('[NOTIFICATION-SERVICE] ✅ Candidate user found, sending email');
                        
                        await this.emailService.sendCandidateApplicationSubmitted(candidate.email, {
                            candidateName: candidate.full_name,
                            jobTitle: job.title,
                            companyName: job.company?.name || 'Unknown Company',
                            hasRecruiter: true,
                            nextSteps: 'Your recruiter has reviewed and submitted your application to the company. They will be in touch if there is interest.',
                            applicationId: application_id,
                            userId: candidateUser.id,
                        });

                        console.log('[NOTIFICATION-SERVICE] ✅ Candidate email sent successfully');
                    } else {
                        console.log('[NOTIFICATION-SERVICE] ⚠️ Candidate user lookup returned null/undefined');
                    }
                } catch (error) {
                    console.log('[NOTIFICATION-SERVICE] ⚠️ Failed to fetch candidate user or send email:', error);
                    this.logger.warn({ candidate_user_id, error }, 'Failed to send candidate email for recruiter submission');
                }
            } else {
                console.log('[NOTIFICATION-SERVICE] ℹ️ No candidate_user_id - candidate is recruiter-managed (no email sent)');
            }

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
     * Note: Only candidates can withdraw their own applications (enforced in ATS service)
     * So withdrawn_by is always 'Candidate'
     */
    async handleApplicationWithdrawn(event: DomainEvent): Promise<void> {
        try {
            const { application_id, job_id, candidate_id, recruiter_id, reason, candidate_user_id } = event.payload;

            console.log('[APPLICATIONS-CONSUMER] 🎯 Handling application.withdrawn event:', {
                application_id,
                candidate_id,
                candidate_user_id,
                recruiter_id,
            });
            this.logger.info({ application_id }, 'Handling application withdrawal by candidate');

            // Fetch job details
            const jobResponse = await this.services.getAtsService().get<any>(`/jobs/${job_id}`);
            const job = jobResponse.data || jobResponse;

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch company details
            const companyResponse = await this.services.getAtsService().get<any>(`/companies/${job.company_id}`);
            const company = companyResponse.data || companyResponse;

            // Get candidate user (if they have an account)
            let candidateUser = null;
            try {
                if (candidate_user_id) {
                    const candidateUserResponse = await this.services.getIdentityService().get<any>(`/users/${candidate_user_id}`);
                    candidateUser = candidateUserResponse.data || candidateUserResponse;
                    console.log('[APPLICATIONS-CONSUMER] ✓ Found candidate user');
                } else {
                    console.log('[APPLICATIONS-CONSUMER] ⚠️ No candidate_user_id in event payload');
                }
            } catch (error) {
                console.log('[APPLICATIONS-CONSUMER] ⚠️ Candidate user account not found');
                this.logger.warn({ candidate_id, candidate_user_id }, 'Candidate user account not found');
            }

            // Send confirmation email to candidate (only if they have a user account)
            if (candidateUser) {
                console.log('[APPLICATIONS-CONSUMER] 📧 Sending withdrawal confirmation to candidate:', candidate.email);
                await this.emailService.sendApplicationWithdrawn(candidate.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || company.name || 'Unknown Company',
                    reason,
                    withdrawnBy: 'Candidate',
                    applicationId: application_id,
                    userId: candidateUser.id, // Use actual user ID
                });
                console.log('[APPLICATIONS-CONSUMER] ✅ Candidate email sent');
            } else {
                console.log('[APPLICATIONS-CONSUMER] ⚠️ Skipping candidate email (no user account)');
            }

            // Notify recruiter if exists
            if (recruiter_id) {
                console.log('[APPLICATIONS-CONSUMER] 🔍 Fetching recruiter details...');
                const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
                const recruiter = recruiterResponse.data || recruiterResponse;

                const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
                const user = userResponse.data || userResponse;

                console.log('[APPLICATIONS-CONSUMER] 📧 Sending withdrawal notification to recruiter:', user.email);
                await this.emailService.sendApplicationWithdrawn(user.email, {
                    candidateName: candidate.full_name,
                    jobTitle: job.title,
                    companyName: job.company?.name || company.name || 'Unknown Company',
                    reason,
                    withdrawnBy: 'Candidate',
                    applicationId: application_id,
                    userId: recruiter.user_id,
                });
                console.log('[APPLICATIONS-CONSUMER] ✅ Recruiter email sent');
            } else {
                console.log('[APPLICATIONS-CONSUMER] ⚠️ No recruiter assigned to application');
            }

            console.log('[APPLICATIONS-CONSUMER] 🎉 Withdrawal notifications complete');
            this.logger.info({ application_id }, 'Application withdrawal notifications sent');
        } catch (error) {
            console.error('[APPLICATIONS-CONSUMER] ❌ Withdrawal handler failed:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                event_payload: event.payload,
            });
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
