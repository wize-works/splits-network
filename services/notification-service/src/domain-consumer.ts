import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { ServiceRegistry } from './clients';
import { NotificationService } from './service';
import { ApplicationsEventConsumer } from './consumers/applications/consumer';
import { PlacementsEventConsumer } from './consumers/placements/consumer';
import { ProposalsEventConsumer } from './consumers/proposals/consumer';
import { CandidatesEventConsumer } from './consumers/candidates/consumer';
import { CollaborationEventConsumer } from './consumers/collaboration/consumer';
import { InvitationsConsumer } from './consumers/invitations/consumer';
import { RecruiterSubmissionEventConsumer } from './consumers/recruiter-submission/consumer';

export class DomainEventConsumer {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly exchange = 'splits-network-events';
    private readonly queue = 'notification-service-queue';

    private applicationsConsumer: ApplicationsEventConsumer;
    private placementsConsumer: PlacementsEventConsumer;
    private proposalsConsumer: ProposalsEventConsumer;
    private candidatesConsumer: CandidatesEventConsumer;
    private collaborationConsumer: CollaborationEventConsumer;
    private invitationsConsumer: InvitationsConsumer;
    private recruiterSubmissionConsumer: RecruiterSubmissionEventConsumer;

    constructor(
        private rabbitMqUrl: string,
        notificationService: NotificationService,
        services: ServiceRegistry,
        private logger: Logger
    ) {
        const portalUrl = process.env.PORTAL_URL || 'http://localhost:3001';
        
        this.applicationsConsumer = new ApplicationsEventConsumer(
            notificationService.applications,
            services,
            logger
        );
        this.placementsConsumer = new PlacementsEventConsumer(
            notificationService.placements,
            services,
            logger
        );
        this.proposalsConsumer = new ProposalsEventConsumer(
            notificationService.proposals,
            services,
            logger
        );
        this.candidatesConsumer = new CandidatesEventConsumer(
            notificationService.candidates,
            services,
            logger
        );
        this.collaborationConsumer = new CollaborationEventConsumer(
            notificationService.collaboration,
            services,
            logger
        );
        this.invitationsConsumer = new InvitationsConsumer(
            notificationService,
            services,
            logger,
            portalUrl
        );
        this.recruiterSubmissionConsumer = new RecruiterSubmissionEventConsumer(
            notificationService.recruiterSubmission,
            services,
            logger
        );
    }

    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.rabbitMqUrl) as any;
            this.channel = await (this.connection as any).createChannel();

            if (!this.channel) throw new Error('Failed to create channel');

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
            await this.channel.assertQueue(this.queue, { durable: true });

            // Bind to events we care about
            // Phase 1 events
            await this.channel.bindQueue(this.queue, this.exchange, 'application.created');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.accepted');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.stage_changed');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.submitted_to_company');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.withdrawn');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.prescreen_requested');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement.created');
            
            // Phase 1.5 events - AI Review
            await this.channel.bindQueue(this.queue, this.exchange, 'ai_review.started');
            await this.channel.bindQueue(this.queue, this.exchange, 'ai_review.completed');
            await this.channel.bindQueue(this.queue, this.exchange, 'ai_review.failed');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.draft_completed');
            
            // Phase 2 events - Ownership & Sourcing
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate.sourced');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate.outreach_recorded');
            await this.channel.bindQueue(this.queue, this.exchange, 'ownership.conflict_detected');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate.invited');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate.consent_given');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate.consent_declined');
            
            // Phase 2 events - Proposals
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal.created');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal.accepted');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal.declined');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal.timeout');
            
            // Phase 2 events - Recruiter Submission (new opportunity proposals)
            await this.channel.bindQueue(this.queue, this.exchange, 'application.recruiter_proposed');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.recruiter_approved');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.recruiter_declined');
            await this.channel.bindQueue(this.queue, this.exchange, 'application.recruiter_opportunity_expired');
            
            // Phase 2 events - Placements
            await this.channel.bindQueue(this.queue, this.exchange, 'placement.activated');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement.completed');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement.failed');
            await this.channel.bindQueue(this.queue, this.exchange, 'replacement.requested');
            await this.channel.bindQueue(this.queue, this.exchange, 'guarantee.expiring');
            
            // Phase 2 events - Collaboration
            await this.channel.bindQueue(this.queue, this.exchange, 'collaborator.added');
            await this.channel.bindQueue(this.queue, this.exchange, 'reputation.updated');
            
            // Invitation events
            await this.channel.bindQueue(this.queue, this.exchange, 'invitation.created');
            await this.channel.bindQueue(this.queue, this.exchange, 'invitation.revoked');

            this.logger.info('Connected to RabbitMQ and bound to events');

            await this.startConsuming();
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to connect to RabbitMQ');
            throw error;
        }
    }

    private async startConsuming(): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }

        await this.channel.consume(
            this.queue,
            async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const event: DomainEvent = JSON.parse(msg.content.toString());
                    console.log('[NOTIFICATION-SERVICE] 📨 Received event from RabbitMQ:', {
                        event_type: event.event_type,
                        payload: event.payload,
                        timestamp: new Date().toISOString(),
                    });
                    this.logger.info({ event_type: event.event_type }, 'Processing event');

                    await this.handleEvent(event);
                    
                    console.log('[NOTIFICATION-SERVICE] ✅ Event processed and acknowledged');
                    this.channel!.ack(msg);
                } catch (error) {
                    this.logger.error({ err: error }, 'Error processing message');
                    this.channel!.nack(msg, false, false);
                }
            },
            { noAck: false }
        );

        this.logger.info('Started consuming events');
    }

    private async handleEvent(event: DomainEvent): Promise<void> {
        switch (event.event_type) {
            // Applications domain
            case 'application.created':
                await this.applicationsConsumer.handleCandidateApplicationSubmitted(event);
                break;
            case 'application.submitted_to_company':
                await this.applicationsConsumer.handleRecruiterSubmittedToCompany(event);
                break;
            case 'application.withdrawn':
                await this.applicationsConsumer.handleApplicationWithdrawn(event);
                break;
            case 'application.accepted':
                await this.applicationsConsumer.handleApplicationAccepted(event);
                break;
            case 'application.stage_changed':
                await this.applicationsConsumer.handleApplicationStageChanged(event);
                break;
            case 'application.prescreen_requested':
                await this.applicationsConsumer.handlePreScreenRequested(event);
                break;

            // Phase 1.5 - AI Review events
            case 'ai_review.started':
                await this.applicationsConsumer.handleAIReviewStarted(event);
                break;
            case 'ai_review.completed':
                await this.applicationsConsumer.handleAIReviewCompleted(event);
                break;
            case 'ai_review.failed':
                await this.applicationsConsumer.handleAIReviewFailed(event);
                break;
            case 'application.draft_completed':
                await this.applicationsConsumer.handleDraftCompleted(event);
                break;

            // Placements domain
            case 'placement.created':
                await this.placementsConsumer.handlePlacementCreated(event);
                break;
            case 'placement.activated':
                await this.placementsConsumer.handlePlacementActivated(event);
                break;
            case 'placement.completed':
                await this.placementsConsumer.handlePlacementCompleted(event);
                break;
            case 'placement.failed':
                await this.placementsConsumer.handlePlacementFailed(event);
                break;
            case 'guarantee.expiring':
                await this.placementsConsumer.handleGuaranteeExpiring(event);
                break;

            // Proposals domain
            case 'proposal.created':
                await this.proposalsConsumer.handleProposalCreated(event);
                break;
            case 'proposal.accepted':
                await this.proposalsConsumer.handleProposalAccepted(event);
                break;
            case 'proposal.declined':
                await this.proposalsConsumer.handleProposalDeclined(event);
                break;
            case 'proposal.timeout':
                await this.proposalsConsumer.handleProposalTimeout(event);
                break;

            // Recruiter Submission domain (opportunity proposals)
            case 'application.recruiter_proposed':
                await this.recruiterSubmissionConsumer.handleRecruiterProposedJob(event);
                break;
            case 'application.recruiter_approved':
                await this.recruiterSubmissionConsumer.handleCandidateApprovedOpportunity(event);
                break;
            case 'application.recruiter_declined':
                await this.recruiterSubmissionConsumer.handleCandidateDeclinedOpportunity(event);
                break;
            case 'application.recruiter_opportunity_expired':
                await this.recruiterSubmissionConsumer.handleOpportunityExpired(event);
                break;

            // Candidates domain
            case 'candidate.sourced':
                await this.candidatesConsumer.handleCandidateSourced(event);
                break;
            case 'ownership.conflict_detected':
                await this.candidatesConsumer.handleOwnershipConflict(event);
                break;
            case 'candidate.invited':
                await this.candidatesConsumer.handleCandidateInvited(event);
                break;
            case 'candidate.consent_given':
                await this.candidatesConsumer.handleConsentGiven(event);
                break;
            case 'candidate.consent_declined':
                await this.candidatesConsumer.handleConsentDeclined(event);
                break;

            // Collaboration domain
            case 'collaborator.added':
                await this.collaborationConsumer.handleCollaboratorAdded(event);
                break;

            // Invitations domain
            case 'invitation.created':
                await this.invitationsConsumer.handleInvitationCreated(event);
                break;
            case 'invitation.revoked':
                await this.invitationsConsumer.handleInvitationRevoked(event);
                break;

            default:
                this.logger.debug({ event_type: event.event_type }, 'Unhandled event type');
        }
    }

    isConnected(): boolean {
        return this.connection !== null && this.channel !== null;
    }

    async close(): Promise<void> {
        if (this.channel) await this.channel.close();
        if (this.connection) await (this.connection as any).close();
        this.logger.info('Disconnected from RabbitMQ');
    }
}
