import { Resend } from 'resend';
import { Logger } from '@splits-network/shared-logging';
import { NotificationRepository } from '../../repository';

export class CandidatesEmailService {
    constructor(
        private resend: Resend,
        private repository: NotificationRepository,
        private fromEmail: string,
        private logger: Logger
    ) {}

    private async sendEmail(
        to: string,
        subject: string,
        html: string,
        options: {
            eventType: string;
            userId?: string;
            payload?: Record<string, any>;
        }
    ): Promise<void> {
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

    async sendCandidateSourced(
        recipientEmail: string,
        data: {
            candidateName: string;
            sourceMethod: string;
            protectionPeriod: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `Candidate Sourced: ${data.candidateName}`;
        const html = `
      <h2>✅ Candidate Successfully Sourced</h2>
      <p>You have successfully claimed sourcing ownership for a candidate.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Source Method:</strong> ${data.sourceMethod}</li>
        <li><strong>Protection Period:</strong> ${data.protectionPeriod}</li>
      </ul>
      <p>You now have exclusive rights to work with this candidate. Other recruiters will be notified if they attempt to source the same candidate.</p>
    `;
        
        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'candidate.sourced',
            userId: data.userId,
            payload: data,
        });
    }

    async sendOwnershipConflict(
        recipientEmail: string,
        data: {
            candidateName: string;
            attemptingRecruiterName: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `Ownership Conflict Detected: ${data.candidateName}`;
        const html = `
      <h2>⚠️ Another Recruiter Attempted to Source Your Candidate</h2>
      <p>Another recruiter has attempted to claim sourcing ownership for a candidate you already sourced.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Attempting Recruiter:</strong> ${data.attemptingRecruiterName}</li>
      </ul>
      <p>Your ownership protection remains in place. The other recruiter has been informed that you have prior claim.</p>
    `;
        
        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'ownership.conflict_detected',
            userId: data.userId,
            payload: data,
        });
    }

    async sendOwnershipConflictRejection(
        recipientEmail: string,
        data: {
            candidateName: string;
            originalSourcerName: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `Candidate Already Claimed: ${data.candidateName}`;
        const html = `
      <h2>❌ Candidate Already Claimed</h2>
      <p>The candidate you attempted to source has already been claimed by another recruiter.</p>
      <ul>
        <li><strong>Candidate:</strong> ${data.candidateName}</li>
        <li><strong>Original Sourcer:</strong> ${data.originalSourcerName}</li>
      </ul>
      <p>The original sourcer has protection rights to this candidate. You may collaborate with them if they add you to a placement.</p>
    `;
        
        await this.sendEmail(recipientEmail, subject, html, {
            eventType: 'ownership.conflict_detected',
            userId: data.userId,
            payload: data,
        });
    }

    async sendCandidateInvitation(
        candidateEmail: string,
        data: {
            candidate_name: string;
            candidate_email: string;
            recruiter_name: string;
            recruiter_email: string;
            recruiter_bio: string;
            invitation_token: string;
            invitation_expires_at: string;
            relationship_id: string;
        }
    ): Promise<void> {
        const subject = `${data.recruiter_name} wants to represent you`;
        const candidateWebsiteUrl = process.env.CANDIDATE_WEBSITE_URL || 'https://applicant.network';
        const invitationUrl = `${candidateWebsiteUrl}/invitation/${data.invitation_token}`;
        
        const expiryDate = new Date(data.invitation_expires_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to Join Applicant Network</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Applicant Network</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${data.candidate_name},</p>
        
        <p style="font-size: 16px;">
            <strong>${data.recruiter_name}</strong> wants to represent you and has invited you to join the <strong>Applicant Network</strong>.
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">About Your Recruiter</h3>
            <p style="margin: 10px 0;"><strong>${data.recruiter_name}</strong></p>
            <p style="margin: 10px 0; color: #6b7280;">${data.recruiter_bio}</p>
            <p style="margin: 10px 0; color: #6b7280;">Contact: ${data.recruiter_email}</p>
        </div>

        <h3 style="color: #667eea;">What is the Applicant Network?</h3>
        <p>The Applicant Network is a platform where you can:</p>
        <ul style="padding-left: 20px;">
            <li>Track job opportunities your recruiter finds for you</li>
            <li>Manage your applications in one place</li>
            <li>Communicate directly with your recruiter</li>
            <li>Stay informed about your job search progress</li>
        </ul>

        <h3 style="color: #667eea;">What is "Right to Represent"?</h3>
        <p>
            By accepting this invitation, you're giving ${data.recruiter_name} permission to submit your profile 
            to job opportunities on your behalf. This is a standard agreement in the recruiting industry that:
        </p>
        <ul style="padding-left: 20px;">
            <li>Formalizes your working relationship with the recruiter</li>
            <li>Prevents duplicate submissions to the same job</li>
            <li>Ensures your recruiter gets credit for placements they facilitate</li>
            <li>Protects your interests throughout the hiring process</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Review & Accept Invitation
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <strong>Important:</strong> This invitation expires on ${expiryDate}. If you don't respond by then, 
            ${data.recruiter_name} will need to send a new invitation.
        </p>

        <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation or have questions, please contact ${data.recruiter_name} directly at 
            <a href="mailto:${data.recruiter_email}" style="color: #667eea;">${data.recruiter_email}</a>.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Splits Network. All rights reserved.</p>
        <p>
            <a href="https://splits.network/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
            <a href="https://splits.network/terms" style="color: #667eea; text-decoration: none;">Terms of Service</a>
        </p>
    </div>
</body>
</html>
        `.trim();

        await this.sendEmail(candidateEmail, subject, html, {
            eventType: 'candidate.invited',
            payload: data,
        });
    }

    async sendConsentGivenToRecruiter(
        recruiterEmail: string,
        data: {
            recruiter_name: string;
            candidate_name: string;
            candidate_email: string;
            consent_given_at: string;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `${data.candidate_name} accepted your invitation!`;
        
        const consentDate = new Date(data.consent_given_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Candidate Accepted Your Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <div style="background: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <i class="fa-solid fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px;">Great News!</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${data.recruiter_name},</p>
        
        <p style="font-size: 16px; line-height: 1.8;">
            <strong>${data.candidate_name}</strong> has accepted your invitation and granted you 
            the right to represent them! You can now submit their profile to job opportunities.
        </p>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #059669;">Candidate Details</h3>
            <p style="margin: 8px 0;"><strong>Name:</strong> ${data.candidate_name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${data.candidate_email}</p>
            <p style="margin: 8px 0;"><strong>Accepted On:</strong> ${consentDate}</p>
        </div>

        <h3 style="color: #059669;">What's Next?</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Review their profile and update any missing information</li>
            <li>Identify suitable job opportunities that match their skills</li>
            <li>Submit their profile to open positions</li>
            <li>Keep them updated on application progress</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://splits.network/candidates" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                View Candidate Profile
            </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Remember to maintain regular communication with ${data.candidate_name} throughout their job search journey.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Splits Network. All rights reserved.</p>
    </div>
</body>
</html>
        `.trim();

        await this.sendEmail(recruiterEmail, subject, html, {
            eventType: 'candidate.consent_given',
            userId: data.userId,
            payload: data,
        });
    }

    async sendConsentDeclinedToRecruiter(
        recruiterEmail: string,
        data: {
            recruiter_name: string;
            candidate_name: string;
            candidate_email: string;
            declined_at: string;
            declined_reason?: string | null;
            userId?: string;
        }
    ): Promise<void> {
        const subject = `${data.candidate_name} declined your invitation`;
        
        const declinedDate = new Date(data.declined_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Candidate Declined Your Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <div style="background: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <i class="fa-solid fa-info-circle" style="font-size: 48px; color: #6b7280;"></i>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px;">Invitation Response</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${data.recruiter_name},</p>
        
        <p style="font-size: 16px; line-height: 1.8;">
            <strong>${data.candidate_name}</strong> has declined your invitation to work together on Applicant Network.
        </p>

        <div style="background: #f9fafb; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #4b5563;">Details</h3>
            <p style="margin: 8px 0;"><strong>Candidate:</strong> ${data.candidate_name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${data.candidate_email}</p>
            <p style="margin: 8px 0;"><strong>Declined On:</strong> ${declinedDate}</p>
            ${data.declined_reason ? `
            <div style="margin-top: 16px;">
                <p style="margin: 8px 0;"><strong>Their Message:</strong></p>
                <p style="background: white; padding: 12px; border-radius: 4px; margin: 8px 0; font-style: italic;">"${data.declined_reason}"</p>
            </div>
            ` : ''}
        </div>

        <h3 style="color: #4b5563;">What Can You Do?</h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
            <li>If they provided feedback, consider how you might adjust your approach</li>
            <li>You can reach out directly to discuss any concerns or misunderstandings</li>
            <li>Focus on building relationships with other candidates in your network</li>
            <li>Review your invitation message and outreach strategy</li>
        </ul>

        <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
                <strong>💡 Tip:</strong> Not every candidate is a perfect fit right now. Keep building your network and focus on candidates who are excited to work with you!
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://splits.network/candidates" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                View Your Candidates
            </a>
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Splits Network. All rights reserved.</p>
    </div>
</body>
</html>
        `.trim();

        await this.sendEmail(recruiterEmail, subject, html, {
            eventType: 'candidate.consent_declined',
            userId: data.userId,
            payload: data,
        });
    }
}
