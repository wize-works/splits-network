/**
 * Proposal Email Templates
 * Professional branded templates for candidate proposal notifications
 */

import { baseEmailTemplate, EmailSource } from '../base';
import { heading, paragraph, button, infoCard, alert, divider } from '../components';

export interface ProposalAcceptedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    proposalUrl: string;
    source?: EmailSource;
}

export function proposalAcceptedEmail(data: ProposalAcceptedData): string {
    const content = `
${heading({ level: 1, text: 'Your Proposal Has Been Accepted!', icon: '✅' })}

${alert({
    type: 'success',
    title: 'Great News!',
    message: 'Your candidate proposal has been accepted by the hiring manager.',
})}

${infoCard({
    title: 'Proposal Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
    ],
})}

${paragraph(
    'You can now proceed with scheduling interviews and moving the candidate through the hiring process.'
)}

${button({
    href: data.proposalUrl,
    text: 'View Proposal Details →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Next Steps:</strong> Coordinate with the hiring manager to schedule initial interviews and prepare the candidate for the process.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Proposal accepted: ${data.candidateName} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}

export interface ProposalDeclinedData {
    candidateName: string;
    jobTitle: string;
    declineReason: string;
    rolesUrl: string;
    source?: EmailSource;
}

export function proposalDeclinedEmail(data: ProposalDeclinedData): string {
    const content = `
${heading({ level: 1, text: 'Proposal Not Accepted' })}

${alert({
    type: 'warning',
    message: 'Unfortunately, your candidate proposal was not accepted by the hiring manager.',
})}

${infoCard({
    title: 'Proposal Information',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Reason', value: data.declineReason },
    ],
})}

${paragraph(
    "Don't be discouraged! Keep sourcing great candidates and submitting proposals to roles that match their skills."
)}

${button({
    href: data.rolesUrl,
    text: 'Browse Open Roles →',
    variant: 'secondary',
})}

${divider()}

${paragraph(
    '<strong>Keep Going:</strong> Every proposal is a learning opportunity. Use the feedback to refine your candidate sourcing and submission strategy.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Proposal declined: ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface ProposalTimeoutData {
    candidateName: string;
    jobTitle: string;
    rolesUrl: string;
    source?: EmailSource;
}

export function proposalTimeoutEmail(data: ProposalTimeoutData): string {
    const content = `
${heading({ level: 1, text: 'Proposal Has Timed Out', icon: '⏰' })}

${alert({
    type: 'info',
    message: 'Your candidate proposal has expired without a response from the hiring manager.',
})}

${infoCard({
    title: 'Proposal Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
    ],
})}

${paragraph(
    'The proposal has been automatically declined due to timeout. You may submit the candidate to other roles that match their qualifications.'
)}

${button({
    href: data.rolesUrl,
    text: 'Find Other Opportunities →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Tip:</strong> Follow up with hiring managers after submitting proposals to increase response rates and demonstrate your engagement.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Proposal expired: ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}
