/**
 * Invitations Email Service
 * Handles sending invitation emails via Resend
 */

import { Resend } from 'resend';
import { NotificationRepository } from '../../repository';
import { Logger } from '@splits-network/shared-logging';

export class InvitationsEmailService {
    constructor(
        private resend: Resend,
        private repository: NotificationRepository,
        private fromEmail: string,
        private logger: Logger
    ) {}

    /**
     * Send invitation email to new team member
     */
    async sendInvitation(payload: {
        invitation_id: string;
        email: string;
        organization_name: string;
        role: string;
        invited_by_name: string;
        invitation_link: string;
        expires_at: string;
    }): Promise<void> {
        const { email, organization_name, role, invited_by_name, invitation_link, expires_at } = payload;

        this.logger.info(
            { invitation_id: payload.invitation_id, email, organization_name },
            'Sending invitation email'
        );

        const roleLabel = this.getRoleLabel(role);
        const expiresDate = new Date(expires_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `You've been invited to join ${organization_name} on Splits Network`,
                html: this.buildInvitationEmail({
                    organization_name,
                    role: roleLabel,
                    invited_by_name,
                    invitation_link,
                    expires_date: expiresDate,
                }),
            });

            if (error) {
                throw error;
            }

            // Log email sent
            await this.repository.createNotificationLog({
                event_type: 'invitation.created',
                recipient_email: email,
                subject: `Invitation to join ${organization_name}`,
                template: 'invitation',
                payload: {
                    invitation_id: payload.invitation_id,
                    organization_name,
                    role,
                },
                status: 'sent',
                resend_message_id: data?.id,
            });

            this.logger.info(
                { invitation_id: payload.invitation_id, email },
                'Invitation email sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { error, invitation_id: payload.invitation_id, email },
                'Failed to send invitation email'
            );
            throw error;
        }
    }

    /**
     * Send invitation revoked email
     */
    async sendInvitationRevoked(payload: {
        email: string;
        organization_name: string;
    }): Promise<void> {
        const { email, organization_name } = payload;

        this.logger.info({ email, organization_name }, 'Sending invitation revoked email');

        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: `Invitation to ${organization_name} has been withdrawn`,
                html: this.buildRevokedEmail(organization_name),
            });

            this.logger.info({ email, organization_name }, 'Revoked email sent successfully');
        } catch (error) {
            this.logger.error(
                { error, email, organization_name },
                'Failed to send revoked email'
            );
            // Don't throw - revocation already happened
        }
    }

    private getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            company_admin: 'Company Administrator',
            hiring_manager: 'Hiring Manager',
            recruiter: 'Recruiter',
        };
        return labels[role] || role;
    }

    private buildInvitationEmail(data: {
        organization_name: string;
        role: string;
        invited_by_name: string;
        invitation_link: string;
        expires_date: string;
    }): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #5568d3; }
        .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .divider { border-top: 1px solid #e0e0e0; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
        </div>
        <div class="content">
            <p style="font-size: 16px;">Hi there!</p>
            
            <p style="font-size: 16px;">
                <strong>${data.invited_by_name}</strong> has invited you to join 
                <strong>${data.organization_name}</strong> on Splits Network as a 
                <strong>${data.role}</strong>.
            </p>

            <div class="info-box">
                <p style="margin: 0; font-size: 14px;">
                    <strong>Organization:</strong> ${data.organization_name}<br>
                    <strong>Role:</strong> ${data.role}<br>
                    <strong>Invited by:</strong> ${data.invited_by_name}
                </p>
            </div>

            <p style="font-size: 16px;">
                Click the button below to accept this invitation and get started:
            </p>

            <div style="text-align: center;">
                <a href="${data.invitation_link}" class="button">Accept Invitation</a>
            </div>

            <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${data.invitation_link}" style="color: #667eea; word-break: break-all;">${data.invitation_link}</a>
            </p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #666;">
                ⏰ This invitation expires on <strong>${data.expires_date}</strong>.
            </p>

            <p style="font-size: 14px; color: #666;">
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Splits Network. All rights reserved.</p>
            <p>Split-fee recruiting made simple.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    private buildRevokedEmail(organization_name: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Invitation Withdrawn</h1>
        </div>
        <div class="content">
            <p style="font-size: 16px;">Hi there,</p>
            
            <p style="font-size: 16px;">
                The invitation to join <strong>${organization_name}</strong> on Splits Network 
                has been withdrawn by the organization administrator.
            </p>

            <p style="font-size: 16px;">
                If you have any questions, please contact the organization directly.
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Splits Network. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }
}
