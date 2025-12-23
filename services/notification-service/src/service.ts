/**
 * Notification Service - Main Coordinator
 * Delegates to domain-specific email services
 */

import { Resend } from 'resend';
import { NotificationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';
import { ApplicationsEmailService } from './services/applications/service';
import { PlacementsEmailService } from './services/placements/service';
import { ProposalsEmailService } from './services/proposals/service';
import { CandidatesEmailService } from './services/candidates/service';
import { CollaborationEmailService } from './services/collaboration/service';
import { InvitationsEmailService } from './services/invitations/service';
import { RecruiterSubmissionEmailService } from './services/recruiter-submission/service';

export class NotificationService {
    public readonly applications: ApplicationsEmailService;
    public readonly placements: PlacementsEmailService;
    public readonly proposals: ProposalsEmailService;
    public readonly candidates: CandidatesEmailService;
    public readonly collaboration: CollaborationEmailService;
    public readonly invitations: InvitationsEmailService;
    public readonly recruiterSubmission: RecruiterSubmissionEmailService;

    constructor(
        repository: NotificationRepository,
        resendApiKey: string,
        fromEmail: string,
        logger: Logger
    ) {
        const resend = new Resend(resendApiKey);

        this.applications = new ApplicationsEmailService(resend, repository, fromEmail, logger);
        this.placements = new PlacementsEmailService(resend, repository, fromEmail, logger);
        this.proposals = new ProposalsEmailService(resend, repository, fromEmail, logger);
        this.candidates = new CandidatesEmailService(resend, repository, fromEmail, logger);
        this.collaboration = new CollaborationEmailService(resend, repository, fromEmail, logger);
        this.invitations = new InvitationsEmailService(resend, repository, fromEmail, logger);
        this.recruiterSubmission = new RecruiterSubmissionEmailService(resend, repository, fromEmail, logger);
    }

    // Legacy compatibility methods - delegate to domain services
    async sendApplicationCreated(...args: Parameters<ApplicationsEmailService['sendApplicationCreated']>) {
        return this.applications.sendApplicationCreated(...args);
    }

    async sendApplicationStageChanged(...args: Parameters<ApplicationsEmailService['sendApplicationStageChanged']>) {
        return this.applications.sendApplicationStageChanged(...args);
    }

    async sendApplicationAccepted(...args: Parameters<ApplicationsEmailService['sendApplicationAccepted']>) {
        return this.applications.sendApplicationAccepted(...args);
    }

    async sendPlacementCreated(...args: Parameters<PlacementsEmailService['sendPlacementCreated']>) {
        return this.placements.sendPlacementCreated(...args);
    }

    async sendPlacementActivated(...args: Parameters<PlacementsEmailService['sendPlacementActivated']>) {
        return this.placements.sendPlacementActivated(...args);
    }

    async sendPlacementCompleted(...args: Parameters<PlacementsEmailService['sendPlacementCompleted']>) {
        return this.placements.sendPlacementCompleted(...args);
    }

    async sendPlacementFailed(...args: Parameters<PlacementsEmailService['sendPlacementFailed']>) {
        return this.placements.sendPlacementFailed(...args);
    }

    async sendGuaranteeExpiring(...args: Parameters<PlacementsEmailService['sendGuaranteeExpiring']>) {
        return this.placements.sendGuaranteeExpiring(...args);
    }

    async sendProposalAccepted(...args: Parameters<ProposalsEmailService['sendProposalAccepted']>) {
        return this.proposals.sendProposalAccepted(...args);
    }

    async sendProposalDeclined(...args: Parameters<ProposalsEmailService['sendProposalDeclined']>) {
        return this.proposals.sendProposalDeclined(...args);
    }

    async sendProposalTimeout(...args: Parameters<ProposalsEmailService['sendProposalTimeout']>) {
        return this.proposals.sendProposalTimeout(...args);
    }

    async sendCandidateSourced(...args: Parameters<CandidatesEmailService['sendCandidateSourced']>) {
        return this.candidates.sendCandidateSourced(...args);
    }

    async sendOwnershipConflict(...args: Parameters<CandidatesEmailService['sendOwnershipConflict']>) {
        return this.candidates.sendOwnershipConflict(...args);
    }

    async sendOwnershipConflictRejection(...args: Parameters<CandidatesEmailService['sendOwnershipConflictRejection']>) {
        return this.candidates.sendOwnershipConflictRejection(...args);
    }

    async sendCollaboratorAdded(...args: Parameters<CollaborationEmailService['sendCollaboratorAdded']>) {
        return this.collaboration.sendCollaboratorAdded(...args);
    }
}

