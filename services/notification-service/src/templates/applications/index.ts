/**
 * Application Email Templates
 * Professional branded templates for application-related notifications
 */

import { baseEmailTemplate, EmailSource } from '../base';
import { heading, paragraph, button, infoCard, alert, divider } from '../components';

export interface ApplicationCreatedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    applicationUrl: string;
    recruiterName?: string;
    source?: EmailSource;
}

export function applicationCreatedEmail(data: ApplicationCreatedData): string {
    const content = `
${heading({ level: 1, text: 'New Candidate Application', icon: '📝' })}

${paragraph(`Your candidate <strong>${data.candidateName}</strong> has submitted an application for review.`)}

${infoCard({
    title: 'Application Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        ...(data.recruiterName ? [{ label: 'Submitted by', value: data.recruiterName }] : []),
    ],
})}

${paragraph(
    'Please review the application, add any additional context, and submit it to the company when ready.'
)}

${button({
    href: data.applicationUrl,
    text: 'Review Application →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    'Need help? Visit our <a href="https://splits.network/help" style="color: #233876; text-decoration: underline;">Help Center</a> or reply to this email.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `New application from ${data.candidateName} for ${data.jobTitle}`,
        source: data.source || 'portal',
        content,
    });
}

export interface ApplicationStageChangedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    oldStage: string;
    newStage: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function applicationStageChangedEmail(data: ApplicationStageChangedData): string {
    const content = `
${heading({ level: 1, text: 'Application Status Update', icon: '🔄' })}

${paragraph(
    `The application for <strong>${data.candidateName}</strong> has moved to a new stage in the hiring process.`
)}

${infoCard({
    title: 'Status Change',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Previous Stage', value: data.oldStage },
        { label: 'New Stage', value: data.newStage, highlight: true },
    ],
})}

${paragraph('Continue tracking the application progress and prepare for the next steps.')}

${button({
    href: data.applicationUrl,
    text: 'View Application →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    'Get real-time updates in your <a href="https://splits.network/dashboard" style="color: #233876; text-decoration: underline;">dashboard</a>.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `${data.candidateName} moved to ${data.newStage} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}

export interface ApplicationAcceptedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function applicationAcceptedEmail(data: ApplicationAcceptedData): string {
    const content = `
${heading({ level: 1, text: 'Application Accepted! 🎉', icon: '✅' })}

${alert({
    type: 'success',
    title: 'Great News!',
    message: `The company has accepted your candidate ${data.candidateName} for the ${data.jobTitle} position.`,
})}

${infoCard({
    title: 'Accepted Application',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
    ],
})}

${paragraph(
    'The candidate has moved forward in the hiring process. Continue to monitor progress and coordinate next steps with the company.'
)}

${button({
    href: data.applicationUrl,
    text: 'View Application Details →',
    variant: 'primary',
})}

${divider()}

${paragraph('<strong>What happens next?</strong>')}

${paragraph(
    'The company will continue their interview process. Stay engaged and be prepared to support your candidate through the hiring journey. When an offer is extended and accepted, a placement will be automatically created.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `${data.candidateName}'s application was accepted by ${data.companyName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface ApplicationRejectedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    reason?: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function applicationRejectedEmail(data: ApplicationRejectedData): string {
    const content = `
${heading({ level: 1, text: 'Application Update' })}

${alert({
    type: 'warning',
    message: `The application for ${data.candidateName} was not moved forward by ${data.companyName}.`,
})}

${infoCard({
    title: 'Application Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
    ],
})}

${paragraph('While this opportunity didn\'t work out, there are many more roles available on the platform.')}

${button({
    href: 'https://splits.network/roles',
    text: 'Browse Open Roles →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Keep Moving Forward:</strong> Every "no" brings you closer to a "yes". Continue submitting quality candidates to build your placement success rate.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Update on ${data.candidateName}'s application`,
        content,
        source: data.source || 'portal',
    });
}

export interface ApplicationWithdrawnData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    reason?: string;
    withdrawnBy: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function applicationWithdrawnEmail(data: ApplicationWithdrawnData): string {
    const content = `
${heading({ level: 1, text: 'Application Withdrawn' })}

${alert({
    type: 'info',
    message: `The application for ${data.candidateName} has been withdrawn from ${data.companyName}.`,
})}

${infoCard({
    title: 'Withdrawal Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Withdrawn by', value: data.withdrawnBy },
        ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
    ],
})}

${paragraph(
    'This application has been removed from consideration. The candidate can no longer be considered for this position through this submission.'
)}

${button({
    href: data.applicationUrl,
    text: 'View Application Record →',
    variant: 'secondary',
})}

${divider()}

${paragraph(
    'Looking for other opportunities? Browse available roles in your <a href="https://splits.network/roles" style="color: #233876; text-decoration: underline;">dashboard</a>.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Application withdrawn: ${data.candidateName} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}

export interface CandidateApplicationSubmittedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    hasRecruiter: boolean;
    nextSteps: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function candidateApplicationSubmittedEmail(data: CandidateApplicationSubmittedData): string {
    const content = `
${heading({ level: 1, text: 'Application Received', icon: '✉️' })}

${paragraph(`Hi <strong>${data.candidateName}</strong>,`)}

${paragraph(
    `Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been successfully received.`
)}

${alert({
    type: 'success',
    title: 'Next Steps',
    message: data.nextSteps,
})}

${
    data.hasRecruiter
        ? paragraph(
              'Your recruiter will review your application and make any final enhancements before submitting it to the company.'
          )
        : ''
}

${paragraph('You can track your application status anytime in your portal.')}

${button({
    href: data.applicationUrl,
    text: 'Track Application Status →',
    variant: 'primary',
})}

${divider()}

${paragraph('<strong>Good luck!</strong> We\'re here to support you throughout the hiring process.')}
    `.trim();

    return baseEmailTemplate({
        preheader: `Application received: ${data.jobTitle} at ${data.companyName}`,
        content,
        source: data.source || 'candidate',
    });
}

export interface CompanyApplicationReceivedData {
    candidateName: string;
    jobTitle: string;
    applicationUrl: string;
    hasRecruiter: boolean;
    recruiterName?: string;
    source?: EmailSource;
}

export function companyApplicationReceivedEmail(data: CompanyApplicationReceivedData): string {
    const content = `
${heading({ level: 1, text: 'New Candidate Application', icon: '👤' })}

${paragraph(`A new candidate has applied for <strong>${data.jobTitle}</strong>.`)}

${infoCard({
    title: 'Application Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        ...(data.hasRecruiter && data.recruiterName
            ? [{ label: 'Recruiter', value: data.recruiterName }]
            : []),
    ],
})}

${
    data.hasRecruiter && data.recruiterName
        ? alert({
              type: 'info',
              message: `This candidate is represented by recruiter <strong>${data.recruiterName}</strong>.`,
          })
        : alert({
              type: 'info',
              message: 'This is a direct candidate application.',
          })
}

${paragraph('Review the candidate\'s profile and determine if they\'re a good fit for your role.')}

${button({
    href: data.applicationUrl,
    text: 'Review Application →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    'Manage all your applications in your <a href="https://splits.network/applications" style="color: #233876; text-decoration: underline;">company portal</a>.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `New application: ${data.candidateName} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}

export interface PreScreenRequestedData {
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    companyName: string;
    requestedBy: string;
    message?: string;
    portalUrl: string;
    source?: EmailSource;
}

export function preScreenRequestedEmail(data: PreScreenRequestedData): string {
    const content = `
${heading({ level: 1, text: 'Pre-Screen Request' })}

${paragraph(
    `<strong>${data.requestedBy}</strong> from <strong>${data.companyName}</strong> has requested your help reviewing a candidate application.`
)}

${infoCard({
    title: 'Candidate Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Email', value: data.candidateEmail },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
    ],
})}

${
    data.message
        ? alert({
              type: 'info',
              title: `Message from ${data.requestedBy}`,
              message: data.message,
          })
        : ''
}

${paragraph('<strong>What\'s Expected?</strong>')}

${paragraph(
    `1. Review the candidate's profile and documents<br>
2. Add your professional insights and recommendations<br>
3. Submit the pre-screened application back to the company`
)}

${button({
    href: data.portalUrl,
    text: 'Start Review →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<em>This direct application came from a candidate who applied without a recruiter. The company values your expertise in evaluating this candidate.</em>'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Pre-screen request: ${data.candidateName} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}

export interface PreScreenRequestConfirmationData {
    candidateName: string;
    jobTitle: string;
    autoAssign: boolean;
    portalUrl: string;
    source?: EmailSource;
}

export function preScreenRequestConfirmationEmail(data: PreScreenRequestConfirmationData): string {
    const content = `
${heading({ level: 1, text: 'Pre-Screen Request Submitted', icon: '✅' })}

${alert({
    type: 'success',
    message: 'Your request for candidate pre-screening has been submitted successfully.',
})}

${infoCard({
    title: 'Request Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        {
            label: 'Assignment',
            value: data.autoAssign
                ? 'Auto-assign (system will select a recruiter)'
                : 'Manually assigned',
        },
    ],
})}

${
    data.autoAssign
        ? alert({
              type: 'info',
              title: 'Auto-Assignment',
              message:
                  'Our system will automatically assign an available recruiter to review this candidate. You\'ll be notified once they submit their review.',
          })
        : alert({
              type: 'info',
              title: 'Manual Assignment',
              message:
                  'The selected recruiter has been notified and will review this candidate. You\'ll receive their insights once the review is complete.',
          })
}

${paragraph('<strong>What Happens Next?</strong>')}

${paragraph(
    `1. Recruiter reviews the candidate's profile<br>
2. Recruiter adds professional insights and recommendations<br>
3. You receive the pre-screened application for final review`
)}

${button({
    href: data.portalUrl,
    text: 'Track Application Status →',
    variant: 'primary',
})}

${divider()}

${paragraph('Typical review timelines: <strong>2-3 business days</strong>')}
    `.trim();

    return baseEmailTemplate({
        preheader: `Pre-screen request confirmed: ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface ApplicationSubmittedToCompanyData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    submittedBy: string;
    applicationUrl: string;
    source?: EmailSource;
}

export function applicationSubmittedToCompanyEmail(data: ApplicationSubmittedToCompanyData): string {
    const content = `
${heading({ level: 1, text: 'Application Submitted to Company', icon: '✉️' })}

${paragraph(
    `The application for <strong>${data.candidateName}</strong> has been submitted to <strong>${data.companyName}</strong> for review.`
)}

${infoCard({
    title: 'Submission Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Submitted by', value: data.submittedBy },
    ],
})}

${alert({
    type: 'info',
    title: 'What\'s Next?',
    message:
        'The company will review the application and provide feedback. You\'ll be notified of any status changes.',
})}

${button({
    href: data.applicationUrl,
    text: 'Track Application Status →',
    variant: 'primary',
})}

${divider()}

${paragraph('Typical review timelines: <strong>3-7 business days</strong>')}
    `.trim();

    return baseEmailTemplate({
        preheader: `Application submitted: ${data.candidateName} for ${data.jobTitle}`,
        content,
        source: data.source || 'portal',
    });
}
