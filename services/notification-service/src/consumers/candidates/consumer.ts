import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { CandidatesEmailService } from '../../services/candidates/service';
import { ServiceRegistry } from '../../clients';

export class CandidatesEventConsumer {
    constructor(
        private emailService: CandidatesEmailService,
        private services: ServiceRegistry,
        private logger: Logger
    ) {}

    async handleCandidateSourced(event: DomainEvent): Promise<void> {
        try {
            const { candidate_id, sourcer_recruiter_id, source_method } = event.payload;
            
            this.logger.info({ candidate_id, sourcer_recruiter_id }, 'Handling candidate sourced notification');
            
            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;
            
            // Fetch sourcer recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${sourcer_recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;
            
            // Fetch user profile to get email
            const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const user = userResponse.data || userResponse;
            
            // Send confirmation email
            await this.emailService.sendCandidateSourced(user.email, {
                candidateName: candidate.full_name,
                sourceMethod: source_method,
                protectionPeriod: '365 days',
                userId: recruiter.user_id,
            });
            
            this.logger.info({ candidate_id, recipient: user.email }, 'Candidate sourced notification sent');
        } catch (error) {
            this.logger.error({ error, event_payload: event.payload }, 'Failed to send candidate sourced notification');
            throw error;
        }
    }

    async handleOwnershipConflict(event: DomainEvent): Promise<void> {
        try {
            const { candidate_id, original_sourcer_id, attempting_recruiter_id } = event.payload;
            
            this.logger.info({ candidate_id, original_sourcer_id }, 'Handling ownership conflict notification');
            
            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;
            
            // Fetch original sourcer
            const originalRecruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${original_sourcer_id}`);
            const originalRecruiter = originalRecruiterResponse.data || originalRecruiterResponse;
            
            const originalUserResponse = await this.services.getIdentityService().get<any>(`/users/${originalRecruiter.user_id}`);
            const originalUser = originalUserResponse.data || originalUserResponse;
            
            // Fetch attempting recruiter
            const attemptingRecruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${attempting_recruiter_id}`);
            const attemptingRecruiter = attemptingRecruiterResponse.data || attemptingRecruiterResponse;
            
            const attemptingUserResponse = await this.services.getIdentityService().get<any>(`/users/${attemptingRecruiter.user_id}`);
            const attemptingUser = attemptingUserResponse.data || attemptingUserResponse;
            
            // Notify original sourcer
            await this.emailService.sendOwnershipConflict(originalUser.email, {
                candidateName: candidate.full_name,
                attemptingRecruiterName: `${attemptingUser.first_name} ${attemptingUser.last_name}`,
                userId: originalRecruiter.user_id,
            });
            
            // Notify attempting recruiter
            await this.emailService.sendOwnershipConflictRejection(attemptingUser.email, {
                candidateName: candidate.full_name,
                originalSourcerName: `${originalUser.first_name} ${originalUser.last_name}`,
                userId: attemptingRecruiter.user_id,
            });
            
            this.logger.info({ candidate_id }, 'Ownership conflict notifications sent');
        } catch (error) {
            this.logger.error({ error, event_payload: event.payload }, 'Failed to send ownership conflict notification');
            throw error;
        }
    }

    async handleCandidateInvited(event: DomainEvent): Promise<void> {
        try {
            const { relationship_id, recruiter_id, candidate_id, invitation_token, invitation_expires_at } = event.payload;

            this.logger.info({ relationship_id, recruiter_id, candidate_id }, 'Handling candidate invited notification');

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile to get name and email
            const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = userResponse.data || userResponse;

            // Send invitation email to candidate
            await this.emailService.sendCandidateInvitation(candidate.email, {
                candidate_name: candidate.full_name,
                candidate_email: candidate.email,
                recruiter_name: `${recruiterUser.first_name} ${recruiterUser.last_name}`,
                recruiter_email: recruiterUser.email,
                recruiter_bio: recruiter.bio || 'A professional recruiter',
                invitation_token: invitation_token,
                invitation_expires_at: invitation_expires_at,
                relationship_id: relationship_id,
            });

            this.logger.info({ 
                candidate_email: candidate.email, 
                recruiter_id
            }, 'Candidate invitation email sent successfully');

        } catch (error) {
            this.logger.error({ err: error, event }, 'Failed to handle candidate invited event');
            throw error;
        }
    }

    async handleConsentGiven(event: DomainEvent): Promise<void> {
        try {
            const { relationship_id, recruiter_id, candidate_id, consent_given_at } = event.payload;

            this.logger.info({ relationship_id, recruiter_id, candidate_id }, 'Handling candidate consent given notification');

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile to get email
            const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = userResponse.data || userResponse;

            // Send acceptance notification to recruiter
            await this.emailService.sendConsentGivenToRecruiter(recruiterUser.email, {
                recruiter_name: `${recruiterUser.first_name} ${recruiterUser.last_name}`,
                candidate_name: candidate.full_name,
                candidate_email: candidate.email,
                consent_given_at: consent_given_at,
                userId: recruiter.user_id,
            });

            this.logger.info({ 
                recruiter_email: recruiterUser.email, 
                candidate_id 
            }, 'Consent given notification sent to recruiter');

        } catch (error) {
            this.logger.error({ err: error, event }, 'Failed to handle candidate consent given event');
            throw error;
        }
    }

    async handleConsentDeclined(event: DomainEvent): Promise<void> {
        try {
            const { relationship_id, recruiter_id, candidate_id, declined_at, declined_reason } = event.payload;

            this.logger.info({ relationship_id, recruiter_id, candidate_id }, 'Handling candidate consent declined notification');

            // Fetch candidate details
            const candidateResponse = await this.services.getAtsService().get<any>(`/candidates/${candidate_id}`);
            const candidate = candidateResponse.data || candidateResponse;

            // Fetch recruiter details
            const recruiterResponse = await this.services.getNetworkService().get<any>(`/recruiters/${recruiter_id}`);
            const recruiter = recruiterResponse.data || recruiterResponse;

            // Fetch recruiter's user profile to get email
            const userResponse = await this.services.getIdentityService().get<any>(`/users/${recruiter.user_id}`);
            const recruiterUser = userResponse.data || userResponse;

            // Send declined notification to recruiter
            await this.emailService.sendConsentDeclinedToRecruiter(recruiterUser.email, {
                recruiter_name: `${recruiterUser.first_name} ${recruiterUser.last_name}`,
                candidate_name: candidate.full_name,
                candidate_email: candidate.email,
                declined_at: declined_at,
                declined_reason: declined_reason,
                userId: recruiter.user_id,
            });

            this.logger.info({ 
                recruiter_email: recruiterUser.email, 
                candidate_id,
                has_reason: !!declined_reason
            }, 'Consent declined notification sent to recruiter');

        } catch (error) {
            this.logger.error({ err: error, event }, 'Failed to handle candidate consent declined event');
            throw error;
        }
    }
}
