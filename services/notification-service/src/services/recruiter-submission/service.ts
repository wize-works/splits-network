/**
 * Recruiter Submission Email Service
 * Sends email notifications for recruiter-initiated opportunity proposals and responses
 */

import { Resend } from 'resend';
import { Logger } from '@splits-network/shared-logging';
import { NotificationRepository } from '../../repository';
import {
    newOpportunityEmail,
    candidateApprovedEmail,
    candidateDeclinedEmail,
    opportunityExpiredEmail,
    NewOpportunityData,
    CandidateApprovedData,
    CandidateDeclinedData,
    OpportunityExpiredData,
} from '../../templates/recruiter-submission';

export class RecruiterSubmissionEmailService {
    constructor(
        private resend: Resend,
        private repository: NotificationRepository,
        private fromEmail: string,
        private logger: Logger
    ) {}

    /**
     * Send email notification and create notification log
     */
    private async sendEmail(
        to: string,
        subject: string,
        html: string,
        options: {
            eventType: string;
            userId?: string;
            applicationId?: string;
            payload?: Record<string, any>;
        }
    ): Promise<void> {
        const log = await this.repository.createNotificationLog({
            event_type: options.eventType,
            recipient_user_id: options.userId,
            recipient_email: to,
            subject,
            template: 'recruiter-submission',
            payload: options.payload,
            channel: 'email',
            status: 'pending',
            read: false,
            dismissed: false,
            priority: 'high',
        });

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject,
                html,
            });

            if (error) {
                throw error;
            }

            await this.repository.updateNotificationLog(log.id, {
                status: 'sent',
                resend_message_id: data?.id,
            });

            this.logger.info(
                { email: to, subject, message_id: data?.id },
                'Email sent successfully'
            );
        } catch (error: any) {
            this.logger.error({ email: to, error }, 'Failed to send email');

            await this.repository.updateNotificationLog(log.id, {
                status: 'failed',
                error_message: error.message || 'Unknown error',
            });

            throw error;
        }
    }

    /**
     * Send notification to candidate about new opportunity
     */
    async sendNewOpportunityNotification(
        to: string,
        data: NewOpportunityData & { userId?: string; applicationId?: string }
    ): Promise<void> {
        const subject = `New Opportunity: ${data.jobTitle} at ${data.companyName}`;
        const html = newOpportunityEmail(data);

        await this.sendEmail(to, subject, html, {
            eventType: 'application.recruiter_proposed',
            userId: data.userId,
            applicationId: data.applicationId,
            payload: {
                candidateName: data.candidateName,
                recruiterName: data.recruiterName,
                jobTitle: data.jobTitle,
                companyName: data.companyName,
            },
        });
    }

    /**
     * Send notification to recruiter when candidate approves opportunity
     */
    async sendCandidateApprovedNotification(
        to: string,
        data: CandidateApprovedData & { userId?: string; applicationId?: string }
    ): Promise<void> {
        const subject = `${data.candidateName} Approved the Opportunity for ${data.jobTitle}`;
        const html = candidateApprovedEmail(data);

        await this.sendEmail(to, subject, html, {
            eventType: 'application.recruiter_approved',
            userId: data.userId,
            applicationId: data.applicationId,
            payload: {
                candidateName: data.candidateName,
                jobTitle: data.jobTitle,
                companyName: data.companyName,
            },
        });
    }

    /**
     * Send notification to recruiter when candidate declines opportunity
     */
    async sendCandidateDeclinedNotification(
        to: string,
        data: CandidateDeclinedData & { userId?: string; applicationId?: string }
    ): Promise<void> {
        const subject = `${data.candidateName} Declined the Opportunity for ${data.jobTitle}`;
        const html = candidateDeclinedEmail(data);

        await this.sendEmail(to, subject, html, {
            eventType: 'application.recruiter_declined',
            userId: data.userId,
            applicationId: data.applicationId,
            payload: {
                candidateName: data.candidateName,
                jobTitle: data.jobTitle,
                companyName: data.companyName,
                declineReason: data.declineReason,
            },
        });
    }

    /**
     * Send notification to candidate when opportunity expires
     */
    async sendOpportunityExpiredNotification(
        to: string,
        data: OpportunityExpiredData & { userId?: string; applicationId?: string }
    ): Promise<void> {
        const subject = `Opportunity Expired: ${data.jobTitle}`;
        const html = opportunityExpiredEmail(data);

        await this.sendEmail(to, subject, html, {
            eventType: 'application.recruiter_opportunity_expired',
            userId: data.userId,
            applicationId: data.applicationId,
            payload: {
                candidateName: data.candidateName,
                recruiterName: data.recruiterName,
                jobTitle: data.jobTitle,
                companyName: data.companyName,
            },
        });
    }
}
