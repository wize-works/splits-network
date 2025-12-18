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

    constructor(
        private rabbitMqUrl: string,
        notificationService: NotificationService,
        services: ServiceRegistry,
        private logger: Logger
    ) {
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
            await this.channel.bindQueue(this.queue, this.exchange, 'application_created');
            await this.channel.bindQueue(this.queue, this.exchange, 'application_accepted');
            await this.channel.bindQueue(this.queue, this.exchange, 'application_stage_changed');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement_created');
            
            // Phase 2 events - Ownership & Sourcing
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate_sourced');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate_outreach_recorded');
            await this.channel.bindQueue(this.queue, this.exchange, 'ownership_conflict_detected');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate_invited');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate_consent_given');
            await this.channel.bindQueue(this.queue, this.exchange, 'candidate_consent_declined');
            
            // Phase 2 events - Proposals
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal_created');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal_accepted');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal_declined');
            await this.channel.bindQueue(this.queue, this.exchange, 'proposal_timeout');
            
            // Phase 2 events - Placements
            await this.channel.bindQueue(this.queue, this.exchange, 'placement_activated');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement_completed');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement_failed');
            await this.channel.bindQueue(this.queue, this.exchange, 'replacement_requested');
            await this.channel.bindQueue(this.queue, this.exchange, 'guarantee_expiring');
            
            // Phase 2 events - Collaboration
            await this.channel.bindQueue(this.queue, this.exchange, 'collaborator_added');
            await this.channel.bindQueue(this.queue, this.exchange, 'reputation_updated');

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
                    this.logger.info({ event_type: event.event_type }, 'Processing event');

                    await this.handleEvent(event);

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
                await this.applicationsConsumer.handleApplicationCreated(event);
                break;
            case 'application.accepted':
                await this.applicationsConsumer.handleApplicationAccepted(event);
                break;
            case 'application.stage_changed':
                await this.applicationsConsumer.handleApplicationStageChanged(event);
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
