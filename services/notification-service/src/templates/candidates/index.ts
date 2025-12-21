/**
 * Candidate Email Templates
 * Professional branded templates for candidate-related notifications
 */

import { baseEmailTemplate, EmailSource } from '../base';
import { heading, paragraph, button, infoCard, alert, divider, badge } from '../components';

export interface CandidateSourcedData {
    candidateName: string;
    sourceMethod: string;
    protectionPeriod: string;
    candidatesUrl: string;
    source?: EmailSource;
}

export function candidateSourcedEmail(data: CandidateSourcedData): string {
    const content = `
${heading({ level: 1, text: 'Candidate Successfully Sourced', icon: '✅' })}

${alert({
    type: 'success',
    message: 'You have successfully claimed sourcing ownership for this candidate.',
})}

${infoCard({
    title: 'Candidate Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Source Method', value: data.sourceMethod },
        { label: 'Protection Period', value: data.protectionPeriod, highlight: true },
    ],
})}

${paragraph(
    'You now have exclusive rights to work with this candidate. Other recruiters will be notified if they attempt to source the same candidate.'
)}

${button({
    href: data.candidatesUrl,
    text: 'View Candidate Profile →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Protection Benefits:</strong> Your ownership is protected during the specified period, ensuring you receive credit for placements facilitated with this candidate.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Sourcing ownership claimed for ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface OwnershipConflictData {
    candidateName: string;
    attemptingRecruiterName: string;
    candidateUrl: string;
    source?: EmailSource;
}

export function ownershipConflictEmail(data: OwnershipConflictData): string {
    const content = `
${heading({ level: 1, text: 'Ownership Conflict Detected', icon: '⚠️' })}

${alert({
    type: 'warning',
    title: 'Another Recruiter Attempted to Source Your Candidate',
    message: `${data.attemptingRecruiterName} attempted to claim sourcing ownership for a candidate you already sourced.`,
})}

${infoCard({
    title: 'Conflict Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Attempting Recruiter', value: data.attemptingRecruiterName },
    ],
})}

${paragraph(
    '<strong>Your ownership protection remains in place.</strong> The other recruiter has been informed that you have prior claim.'
)}

${button({
    href: data.candidateUrl,
    text: 'View Candidate →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    'This notification is for your awareness. No action is required - your rights are automatically protected by the platform.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Ownership conflict for ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface OwnershipConflictRejectionData {
    candidateName: string;
    originalSourcerName: string;
    candidatesUrl: string;
    source?: EmailSource;
}

export function ownershipConflictRejectionEmail(data: OwnershipConflictRejectionData): string {
    const content = `
${heading({ level: 1, text: 'Candidate Already Claimed', icon: '❌' })}

${alert({
    type: 'error',
    message: 'The candidate you attempted to source has already been claimed by another recruiter.',
})}

${infoCard({
    title: 'Conflict Information',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Original Sourcer', value: data.originalSourcerName },
    ],
})}

${paragraph(
    'The original sourcer has protection rights to this candidate. You may collaborate with them if they add you to a placement.'
)}

${button({
    href: data.candidatesUrl,
    text: 'Browse Available Candidates →',
    variant: 'secondary',
})}

${divider()}

${paragraph(
    '<strong>Why does this happen?</strong> Sourcing protection prevents duplicate claims and ensures fair credit allocation in split-fee recruiting.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Cannot source ${data.candidateName} - already claimed`,
        content,
        source: data.source || 'portal',
    });
}

export interface CollaboratorAddedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    role: string;
    splitPercentage: number;
    placementUrl: string;
    source?: EmailSource;
}

export function collaboratorAddedEmail(data: CollaboratorAddedData): string {
    const content = `
${heading({ level: 1, text: "You've Been Added as a Collaborator" })}

${alert({
    type: 'success',
    message: "You've been added to a placement team and will receive a split of the fee.",
})}

${infoCard({
    title: 'Placement Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Your Role', value: data.role },
        { label: 'Your Split', value: `${data.splitPercentage}%`, highlight: true },
    ],
})}

${paragraph('Work with the team to ensure a successful placement and earn your share of the fee.')}

${button({
    href: data.placementUrl,
    text: 'View Placement Details →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Next Steps:</strong> Coordinate with other team members and fulfill your role responsibilities to help close this placement successfully.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Added to placement: ${data.candidateName} at ${data.companyName}`,
        content,
        source: data.source || 'portal',
    });
}
