/**
 * Invitation Email Templates
 * Professional branded templates for team invitation notifications
 */

import { baseEmailTemplate, EmailSource } from '../base';
import { heading, paragraph, button, infoCard, alert, divider, badge } from '../components';

export interface TeamInvitationData {
    organizationName: string;
    role: string;
    invitedByName: string;
    invitationLink: string;
    expiresDate: string;
    source?: EmailSource;
}

export function teamInvitationEmail(data: TeamInvitationData): string {
    const content = `
${heading({ level: 1, text: "You're Invited" })}

${paragraph(
    `<strong>${data.invitedByName}</strong> has invited you to join <strong>${data.organizationName}</strong> on Splits Network as a <strong>${data.role}</strong>.`
)}

${infoCard({
    title: 'Invitation Details',
    items: [
        { label: 'Organization', value: data.organizationName },
        { label: 'Role', value: data.role },
        { label: 'Invited by', value: data.invitedByName },
        { label: 'Expires', value: data.expiresDate, highlight: true },
    ],
})}

${paragraph('Click the button below to accept this invitation and get started:')}

${button({
    href: data.invitationLink,
    text: 'Accept Invitation',
    variant: 'primary',
})}

${divider()}

${alert({
    type: 'info',
    message: `This invitation expires on ${data.expiresDate}. If you don't expect this invitation, you can safely ignore this email.`,
})}
    `.trim();

    return baseEmailTemplate({
        preheader: `Invitation to join ${data.organizationName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface InvitationRevokedData {
    organizationName: string;
    source?: EmailSource;
}

export function invitationRevokedEmail(data: InvitationRevokedData): string {
    const content = `
${heading({ level: 1, text: 'Invitation Withdrawn' })}

${alert({
    type: 'warning',
    message: `The invitation to join ${data.organizationName} on Splits Network has been withdrawn by the organization administrator.`,
})}

${paragraph(
    'If you have any questions about this decision, please contact the organization directly for more information.'
)}

${divider()}

${paragraph('This is an automated notification. No action is required on your part.')}
    `.trim();

    return baseEmailTemplate({
        preheader: `Invitation to ${data.organizationName} has been withdrawn`,
        content,
        source: data.source || 'portal',
    });
}
