/**
 * Placement Email Templates
 * Professional branded templates for placement-related notifications
 */

import { baseEmailTemplate, EmailSource } from '../base';
import { heading, paragraph, button, infoCard, alert, divider, badge } from '../components';

export interface PlacementCreatedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    salary: number;
    recruiterShare: number;
    placementUrl: string;
    source?: EmailSource;
}

export function placementCreatedEmail(data: PlacementCreatedData): string {
    const content = `
${heading({ level: 1, text: 'Placement Confirmed' })}

${alert({
    type: 'success',
    title: 'Congratulations!',
    message: `Your candidate ${data.candidateName} has been successfully placed. Your fee is being processed.`,
})}

${infoCard({
    title: 'Placement Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Annual Salary', value: `$${data.salary.toLocaleString()}` },
        { label: 'Your Fee', value: `$${data.recruiterShare.toLocaleString()}`, highlight: true },
    ],
})}

${paragraph(
    '<strong>What happens next?</strong> Your placement fee will be processed according to your payout schedule. The placement enters a guarantee period where we monitor candidate retention.'
)}

${button({
    href: data.placementUrl,
    text: 'View Placement Details →',
    variant: 'primary',
})}

${divider()}

${alert({
    type: 'info',
    title: 'Guarantee Period',
    message:
        'Most placements have a 90-day guarantee period. If the candidate leaves during this time, fees may be adjusted according to your agreement.',
})}

${paragraph('Keep up the great work! Every successful placement builds your reputation on the platform.')}
    `.trim();

    return baseEmailTemplate({
        preheader: `🎉 Placement confirmed: ${data.candidateName} - $${data.recruiterShare.toLocaleString()}`,
        content,
        source: data.source || 'portal',
    });
}

export interface PlacementActivatedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    startDate: string;
    guaranteePeriodDays: number;
    placementUrl: string;
    source?: EmailSource;
}

export function placementActivatedEmail(data: PlacementActivatedData): string {
    const content = `
${heading({ level: 1, text: 'Placement Activated' })}

${paragraph(
    `<strong>${data.candidateName}</strong> has started their new role at <strong>${data.companyName}</strong>. The guarantee period is now active.`
)}

${infoCard({
    title: 'Placement Status',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Start Date', value: data.startDate },
        { label: 'Guarantee Period', value: `${data.guaranteePeriodDays} days`, highlight: true },
    ],
})}

${alert({
    type: 'info',
    title: 'Stay Connected',
    message:
        'During the guarantee period, consider checking in with your candidate to ensure a smooth transition. This helps maintain placement success.',
})}

${button({
    href: data.placementUrl,
    text: 'Monitor Placement →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Best Practice:</strong> Check in with your candidate at 30, 60, and 90 days to ensure they\'re settling in well.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `${data.candidateName} started at ${data.companyName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface PlacementCompletedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    recruiterShare: number;
    placementUrl: string;
    source?: EmailSource;
}

export function placementCompletedEmail(data: PlacementCompletedData): string {
    const content = `
${heading({ level: 1, text: 'Placement Completed Successfully' })}

${alert({
    type: 'success',
    title: 'Congratulations!',
    message: `The guarantee period has ended successfully for ${data.candidateName}. Your placement is now complete!`,
})}

${infoCard({
    title: 'Completed Placement',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Your Earning', value: `$${data.recruiterShare.toLocaleString()}`, highlight: true },
    ],
})}

${paragraph(
    'This successful placement has been added to your track record. Great work maintaining candidate retention through the guarantee period!'
)}

${button({
    href: data.placementUrl,
    text: 'View Placement Details →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Keep the momentum going!</strong> Successful placements improve your reputation and increase your opportunities on the platform.'
)}

${button({
    href: 'https://splits.network/roles',
    text: 'Find Your Next Placement →',
    variant: 'secondary',
})}
    `.trim();

    return baseEmailTemplate({
        preheader: `🎊 Placement completed: ${data.candidateName} at ${data.companyName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface PlacementFailedData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    reason?: string;
    placementUrl: string;
    source?: EmailSource;
}

export function placementFailedEmail(data: PlacementFailedData): string {
    const content = `
${heading({ level: 1, text: 'Placement Status Update' })}

${alert({
    type: 'warning',
    message: `The placement for ${data.candidateName} at ${data.companyName} did not complete successfully.`,
})}

${infoCard({
    title: 'Placement Details',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
    ],
})}

${paragraph(
    'According to your placement agreement, fees will be adjusted as outlined in the guarantee terms. We\'ve updated the placement status accordingly.'
)}

${button({
    href: data.placementUrl,
    text: 'View Placement Details →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    '<strong>Moving Forward:</strong> While this didn\'t work out, your continued success on the platform is important to us. If you have questions about the guarantee process, please reach out.'
)}

${button({
    href: 'https://splits.network/help',
    text: 'Contact Support',
    variant: 'secondary',
})}
    `.trim();

    return baseEmailTemplate({
        preheader: `Placement update for ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}

export interface GuaranteeExpiringData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    daysRemaining: number;
    guaranteeEndDate: string;
    placementUrl: string;
    source?: EmailSource;
}

export function guaranteeExpiringEmail(data: GuaranteeExpiringData): string {
    const content = `
${heading({ level: 1, text: 'Guarantee Period Ending Soon', icon: '⏰' })}

${paragraph(
    `The guarantee period for <strong>${data.candidateName}</strong> at <strong>${data.companyName}</strong> is ending in <strong>${data.daysRemaining} days</strong>.`
)}

${infoCard({
    title: 'Placement Status',
    items: [
        { label: 'Candidate', value: data.candidateName },
        { label: 'Position', value: data.jobTitle },
        { label: 'Company', value: data.companyName },
        { label: 'Days Remaining', value: data.daysRemaining.toString(), highlight: true },
        { label: 'Guarantee Ends', value: data.guaranteeEndDate },
    ],
})}

${alert({
    type: 'info',
    title: 'Final Check-In Recommended',
    message:
        'Consider reaching out to your candidate one final time to ensure everything is going well before the guarantee period ends.',
})}

${button({
    href: data.placementUrl,
    text: 'View Placement Details →',
    variant: 'primary',
})}

${divider()}

${paragraph(
    'If the candidate completes the guarantee period successfully, your placement will be marked as complete and fully earned.'
)}
    `.trim();

    return baseEmailTemplate({
        preheader: `Guarantee ending in ${data.daysRemaining} days: ${data.candidateName}`,
        content,
        source: data.source || 'portal',
    });
}
