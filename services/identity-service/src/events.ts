import amqp, { Connection, Channel } from 'amqplib';
import { Logger } from '@splits-network/shared-logging';
import { DomainEvent } from '@splits-network/shared-types';
import { randomUUID } from 'crypto';

export class EventPublisher {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly exchange = 'splits-network-events';

    constructor(
        private rabbitMqUrl: string,
        private logger: Logger
    ) {}

    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.rabbitMqUrl) as any;
            this.channel = await (this.connection as any).createChannel();
            if (!this.channel) throw new Error('Failed to create channel');
            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
            this.logger.info('Connected to RabbitMQ');
        } catch (error) {
            this.logger.error({ err: error }, 'Failed to connect to RabbitMQ');
            throw error;
        }
    }

    async publish(eventType: string, payload: Record<string, any>, sourceService: string): Promise<void> {
        if (!this.channel) {
            this.logger.warn(
                { event_type: eventType },
                'Skipping event publish - RabbitMQ channel not initialized'
            );
            return;
        }

        const event: DomainEvent = {
            event_id: randomUUID(),
            event_type: eventType,
            timestamp: new Date().toISOString(),
            source_service: sourceService,
            payload,
        };

        const routingKey = eventType.replace('.', '_');
        const message = Buffer.from(JSON.stringify(event));

        this.channel.publish(this.exchange, routingKey, message, {
            persistent: true,
            contentType: 'application/json',
        });

        this.logger.info({ event_type: eventType, event_id: event.event_id }, 'Published event');
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
