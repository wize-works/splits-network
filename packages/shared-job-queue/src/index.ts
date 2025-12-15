import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { Logger } from '@splits-network/shared-logging';

export interface JobQueueConfig {
    rabbitMqUrl: string;
    queueName: string;
    logger?: Logger;
    maxRetries?: number;
    retryDelay?: number; // milliseconds
}

export interface JobData {
    [key: string]: any;
}

export interface JobMessage<T = JobData> {
    id: string;
    jobName: string;
    data: T;
    attempts: number;
    createdAt: Date;
    scheduledFor?: Date;
}

export interface JobResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

/**
 * Base Job Queue for async processing
 * Uses RabbitMQ for reliable job execution (consistent with our event-driven architecture)
 */
export class JobQueue<T extends JobData = JobData> {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private readonly exchange = 'splits-network-jobs';
    private readonly deadLetterExchange = 'splits-network-jobs-dlx';
    private logger: Logger;
    private isProcessing = false;

    constructor(private config: JobQueueConfig) {
        this.logger = config.logger || (console as any);
    }

    /**
     * Connect to RabbitMQ and set up queues
     */
    async connect(): Promise<void> {
        try {
            this.connection = (await amqp.connect(this.config.rabbitMqUrl)) as any;
            this.channel = await (this.connection as any).createChannel();

            if (!this.channel) throw new Error('Failed to create channel');

            // Create exchanges
            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
            await this.channel.assertExchange(this.deadLetterExchange, 'topic', { durable: true });

            // Create main queue with DLX
            await this.channel.assertQueue(this.config.queueName, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': this.deadLetterExchange,
                    'x-dead-letter-routing-key': `${this.config.queueName}.failed`,
                },
            });

            // Create dead letter queue
            const dlqName = `${this.config.queueName}.dlq`;
            await this.channel.assertQueue(dlqName, { durable: true });

            // Bind queues
            await this.channel.bindQueue(this.config.queueName, this.exchange, this.config.queueName);
            await this.channel.bindQueue(dlqName, this.deadLetterExchange, `${this.config.queueName}.failed`);

            // Set prefetch for fair distribution
            await this.channel.prefetch(1);

            this.logger.info({ queueName: this.config.queueName }, 'Job queue connected');
        } catch (error) {
            this.logger.error({ error }, 'Failed to connect to job queue');
            throw error;
        }
    }

    /**
     * Add a job to the queue
     */
    async addJob(
        jobName: string,
        data: T,
        options?: {
            delay?: number; // milliseconds
            priority?: number;
        }
    ): Promise<string> {
        if (!this.channel) {
            throw new Error('Queue not connected');
        }

        const jobId = `${jobName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const message: JobMessage<T> = {
            id: jobId,
            jobName,
            data,
            attempts: 0,
            createdAt: new Date(),
            scheduledFor: options?.delay ? new Date(Date.now() + options.delay) : undefined,
        };

        const messageBuffer = Buffer.from(JSON.stringify(message));

        // If delayed, use delayed message exchange pattern
        if (options?.delay) {
            // For RabbitMQ 3.6+, we can use delayed message plugin or TTL with DLX
            // Simple approach: use TTL to delay messages
            const delayQueue = `${this.config.queueName}.delay.${options.delay}`;
            await this.channel.assertQueue(delayQueue, {
                durable: true,
                arguments: {
                    'x-message-ttl': options.delay,
                    'x-dead-letter-exchange': this.exchange,
                    'x-dead-letter-routing-key': this.config.queueName,
                },
            });

            this.channel.sendToQueue(delayQueue, messageBuffer, {
                persistent: true,
                priority: options?.priority,
            });
        } else {
            this.channel.publish(this.exchange, this.config.queueName, messageBuffer, {
                persistent: true,
                priority: options?.priority,
            });
        }

        this.logger.info({ jobId, jobName, queueName: this.config.queueName }, 'Job added to queue');

        return jobId;
    }

    /**
     * Process jobs with a handler function
     */
    async startWorker(
        processor: (job: JobMessage<T>) => Promise<JobResult>,
        options?: {
            concurrency?: number;
        }
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Queue not connected');
        }

        if (this.isProcessing) {
            throw new Error('Worker already started');
        }

        this.isProcessing = true;
        const concurrency = options?.concurrency || 1;

        // Set prefetch based on concurrency
        await this.channel.prefetch(concurrency);

        await this.channel.consume(
            this.config.queueName,
            async (msg: ConsumeMessage | null) => {
                if (!msg) return;

                try {
                    const job: JobMessage<T> = JSON.parse(msg.content.toString());
                    
                    this.logger.info(
                        { jobId: job.id, jobName: job.jobName, attempt: job.attempts + 1 },
                        'Processing job'
                    );

                    const result = await processor(job);

                    if (result.success) {
                        this.channel!.ack(msg);
                        this.logger.info({ jobId: job.id, jobName: job.jobName }, 'Job completed successfully');
                    } else {
                        // Retry logic
                        await this.handleJobFailure(msg, job, result.error);
                    }
                } catch (error) {
                    this.logger.error({ error }, 'Error processing job');
                    const job: JobMessage<T> = JSON.parse(msg.content.toString());
                    await this.handleJobFailure(msg, job, error instanceof Error ? error.message : 'Unknown error');
                }
            },
            { noAck: false }
        );

        this.logger.info(
            { queueName: this.config.queueName, concurrency },
            'Worker started'
        );
    }

    /**
     * Handle job failure with retry logic
     */
    private async handleJobFailure(
        msg: ConsumeMessage,
        job: JobMessage<T>,
        errorMessage?: string
    ): Promise<void> {
        const maxRetries = this.config.maxRetries || 3;
        const retryDelay = this.config.retryDelay || 5000;

        job.attempts += 1;

        if (job.attempts < maxRetries) {
            // Retry with exponential backoff
            const delay = retryDelay * Math.pow(2, job.attempts - 1);
            
            this.logger.warn(
                { jobId: job.id, attempt: job.attempts, maxRetries, delay },
                'Job failed, retrying'
            );

            // Reject and requeue with delay
            this.channel!.nack(msg, false, false);
            
            // Add back to queue with delay
            await this.addJob(job.jobName, job.data, { delay });
        } else {
            // Max retries exceeded, send to DLQ
            this.logger.error(
                { jobId: job.id, attempts: job.attempts, error: errorMessage },
                'Job failed after all retries'
            );
            
            this.channel!.nack(msg, false, false); // Will go to DLQ
        }
    }

    /**
     * Get failed jobs from DLQ
     */
    async getFailedJobs(limit: number = 100): Promise<JobMessage<T>[]> {
        if (!this.channel) {
            throw new Error('Queue not connected');
        }

        const dlqName = `${this.config.queueName}.dlq`;
        const failedJobs: JobMessage<T>[] = [];

        for (let i = 0; i < limit; i++) {
            const msg = await this.channel.get(dlqName, { noAck: false });
            if (!msg) break;

            const job: JobMessage<T> = JSON.parse(msg.content.toString());
            failedJobs.push(job);
            
            // Don't ack, just inspect
            this.channel.nack(msg, false, true);
        }

        return failedJobs;
    }

    /**
     * Retry a failed job
     */
    async retryFailedJob(jobId: string): Promise<void> {
        if (!this.channel) {
            throw new Error('Queue not connected');
        }

        const dlqName = `${this.config.queueName}.dlq`;
        
        // Get message from DLQ
        const msg = await this.channel.get(dlqName, { noAck: false });
        if (!msg) {
            throw new Error(`Job ${jobId} not found in DLQ`);
        }

        const job: JobMessage<T> = JSON.parse(msg.content.toString());
        
        if (job.id !== jobId) {
            // Not the right job, put it back
            this.channel.nack(msg, false, true);
            throw new Error(`Job ${jobId} not found in DLQ`);
        }

        // Reset attempts and requeue
        job.attempts = 0;
        await this.addJob(job.jobName, job.data);
        
        // Remove from DLQ
        this.channel.ack(msg);
        
        this.logger.info({ jobId }, 'Retrying failed job');
    }

    /**
     * Close connections
     */
    async close(): Promise<void> {
        this.isProcessing = false;

        if (this.channel) {
            await this.channel.close();
            this.channel = null;
        }
        if (this.connection) {
            // Connection will be closed when channel closes
            this.connection = null;
        }
        
        this.logger.info({ queueName: this.config.queueName }, 'Job queue closed');
    }
}
