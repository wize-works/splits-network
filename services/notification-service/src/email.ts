import { Resend } from 'resend';
import { Logger } from '@splits-network/shared-logging';
import { NotificationRepository } from './repository';

export class EmailService {
    private resend: Resend;

    constructor(
        private repository: NotificationRepository,
        resendApiKey: string,
        private fromEmail: string,
        private logger: Logger
    ) {
        this.resend = new Resend(resendApiKey);
    }

    async sendEmail(
        to: string,
        subject: string,
        html: string,
        options: {
            eventType: string;
            userId?: string;
            payload?: Record<string, any>;
        }
    ): Promise<void> {
        // Create pending notification log
        const log = await this.repository.createNotificationLog({
            event_type: options.eventType,
            recipient_user_id: options.userId,
            recipient_email: to,
            subject,
            template: 'custom',
            payload: options.payload,
            status: 'pending',
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

            // Update log with success
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

            // Update log with failure
            await this.repository.updateNotificationLog(log.id, {
                status: 'failed',
                error_message: error.message || 'Unknown error',
            });

            throw error;
        }
    }

    async sendApplicationCreated(
        recipientEmail: string,
        data: {
            candidateName: string;
            jobTitle: string;
            companyName: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `New Candidate Submitted: ${data.candidateName} for ${data.jobTitle}`;
        const html = `
      <h2>New Candidate Submission</h2>
      <p>A new candidate has been submitted to a role on Splits Network.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Role:</strong> ${data.jobTitle}</li>
        <li><strong>Company:</strong> ${data.companyName}</li>
      </ul>
      <p>Log in to Splits Network to review the application.</p>
    `;

        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'application.created',
            userId: data.userId,
            payload: data,
        });
    }

    async sendApplicationStageChanged(
        recipientEmail: string,
        data: {
            candidateName: string;
            jobTitle: string;
            oldStage: string;
            newStage: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `Application Update: ${data.candidateName} - ${data.newStage}`;
        const html = `
      <h2>Application Stage Changed</h2>
      <p>An application has moved to a new stage.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Role:</strong> ${data.jobTitle}</li>
        <li><strong>Previous Stage:</strong> ${data.oldStage}</li>
        <li><strong>New Stage:</strong> ${data.newStage}</li>
      </ul>
      <p>Log in to Splits Network to view details.</p>
    `;

        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'application.stage_changed',
            userId: data.userId,
            payload: data,
        });
    }

    async sendPlacementCreated(
        recipientEmail: string,
        data: {
            candidateName: string;
            jobTitle: string;
            companyName: string;
            salary: number;
            recruiterShare: number;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `Placement Confirmed: ${data.candidateName} - $${data.recruiterShare.toFixed(2)}`;
        const html = `
      <h2>🎉 Placement Confirmed!</h2>
      <p>Congratulations! A candidate you submitted has been hired.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Role:</strong> ${data.jobTitle}</li>
        <li><strong>Company:</strong> ${data.companyName}</li>
        <li><strong>Salary:</strong> $${data.salary.toLocaleString()}</li>
        <li><strong>Your Share:</strong> $${data.recruiterShare.toLocaleString()}</li>
      </ul>
      <p>Payment details will be processed according to your payout schedule.</p>
    `;

        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'placement.created',
            userId: data.userId,
            payload: data,
        });
    }
}
