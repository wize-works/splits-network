import {
    loadBaseConfig,
    loadDatabaseConfig,
    loadRabbitMQConfig,
    loadResendConfig,
} from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import { NotificationRepository } from './repository';
import { EmailService } from './email';
import { EventConsumer } from './consumer';
import { ServiceRegistry } from './clients';

async function main() {
    const baseConfig = loadBaseConfig('notification-service');
    const dbConfig = loadDatabaseConfig();
    const rabbitConfig = loadRabbitMQConfig();
    const resendConfig = loadResendConfig();

    // Load service URLs from environment
    const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
    const atsServiceUrl = process.env.ATS_SERVICE_URL || 'http://localhost:3002';
    const networkServiceUrl = process.env.NETWORK_SERVICE_URL || 'http://localhost:3003';

    const logger = createLogger({
        serviceName: baseConfig.serviceName,
        level: baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
        prettyPrint: baseConfig.nodeEnv === 'development',
    });

    logger.info(
        { identityServiceUrl, atsServiceUrl, networkServiceUrl },
        'Service URLs configured'
    );

    const app = await buildServer({
        logger,
        cors: {
            origin: true,
            credentials: true,
        },
    });

    app.setErrorHandler(errorHandler);

    // Initialize repository and email service
    const repository = new NotificationRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey || dbConfig.supabaseAnonKey
    );

    const emailService = new EmailService(
        repository,
        resendConfig.apiKey,
        resendConfig.fromEmail,
        logger
    );

    // Initialize service registry for inter-service calls
    const services = new ServiceRegistry(
        identityServiceUrl,
        atsServiceUrl,
        networkServiceUrl,
        logger
    );

    // Initialize event consumer
    const consumer = new EventConsumer(rabbitConfig.url, emailService, services, logger);
    await consumer.connect();

    // Optional: Add HTTP endpoint for manual notifications
    app.post('/send-test-email', async (request, reply) => {
        const { to, subject, html } = request.body as any;
        await emailService.sendEmail(to, subject, html, { eventType: 'test' });
        return reply.send({ success: true });
    });

    // Health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            // Check database connectivity
            await repository.healthCheck();
            // Check RabbitMQ connectivity
            const rabbitHealthy = consumer.isConnected();
            if (!rabbitHealthy) {
                throw new Error('RabbitMQ not connected');
            }
            return reply.status(200).send({
                status: 'healthy',
                service: 'notification-service',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ err: error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                service: 'notification-service',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        await consumer.close();
        await app.close();
        process.exit(0);
    });

    // Start server
    try {
        await app.listen({ port: baseConfig.port, host: '0.0.0.0' });
        logger.info(`Notification service listening on port ${baseConfig.port}`);
    } catch (err) {
        logger.error(err);
        await consumer.close();
        process.exit(1);
    }
}

main();
