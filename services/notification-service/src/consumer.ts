import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { EmailService } from './email';

export class EventConsumer {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly exchange = 'splits-network-events';
    private readonly queue = 'notification-service-queue';

    constructor(
        private rabbitMqUrl: string,
        private emailService: EmailService,
        private logger: Logger
    ) { }

    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.rabbitMqUrl) as any;
            this.channel = await (this.connection as any).createChannel();

            if (!this.channel) throw new Error('Failed to create channel');

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
            await this.channel.assertQueue(this.queue, { durable: true });

            // Bind to events we care about
            await this.channel.bindQueue(this.queue, this.exchange, 'application_created');
            await this.channel.bindQueue(this.queue, this.exchange, 'application_stage_changed');
            await this.channel.bindQueue(this.queue, this.exchange, 'placement_created');

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
                    // Reject and requeue (consider dead letter queue in production)
                    this.channel!.nack(msg, false, false);
                }
            },
            { noAck: false }
        );

        this.logger.info('Started consuming events');
    }

    private async handleEvent(event: DomainEvent): Promise<void> {
        switch (event.event_type) {
            case 'application.created':
                await this.handleApplicationCreated(event);
                break;

            case 'application.stage_changed':
                await this.handleApplicationStageChanged(event);
                break;

            case 'placement.created':
                await this.handlePlacementCreated(event);
                break;

            default:
                this.logger.debug({ event_type: event.event_type }, 'Unhandled event type');
        }
    }

    private async handleApplicationCreated(event: DomainEvent): Promise<void> {
        // In a real implementation, you'd fetch user/job/candidate details from services
        // For now, we'll use placeholder data
        const { application_id, job_id, candidate_id, recruiter_id } = event.payload;

        this.logger.info(
            { application_id, job_id, candidate_id },
            'Would send application created email'
        );

        // TODO: Fetch actual data and send email
        // const recipientEmail = await fetchRecipientEmail(recruiter_id);
        // await this.emailService.sendApplicationCreated(recipientEmail, {...});
    }

    private async handleApplicationStageChanged(event: DomainEvent): Promise<void> {
        const { application_id, old_stage, new_stage } = event.payload;

        this.logger.info(
            { application_id, old_stage, new_stage },
            'Would send stage changed email'
        );

        // TODO: Fetch actual data and send email
    }

    private async handlePlacementCreated(event: DomainEvent): Promise<void> {
        const { placement_id, recruiter_id, recruiter_share } = event.payload;

        this.logger.info(
            { placement_id, recruiter_id, recruiter_share },
            'Would send placement created email'
        );

        // TODO: Fetch actual data and send email
    }

    async close(): Promise<void> {
        if (this.channel) await this.channel.close();
        if (this.connection) await (this.connection as any).close();
        this.logger.info('Disconnected from RabbitMQ');
    }
}
