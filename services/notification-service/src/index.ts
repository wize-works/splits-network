import {
    loadBaseConfig,
    loadDatabaseConfig,
    loadRabbitMQConfig,
    loadResendConfigFromVault,
} from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import { NotificationRepository } from './repository';
import { EmailService } from './email';
import { EventConsumer } from './consumer';

async function main() {
    const baseConfig = loadBaseConfig('notification-service');
    const dbConfig = loadDatabaseConfig();
    const rabbitConfig = loadRabbitMQConfig();
    const resendConfig = await loadResendConfigFromVault();

    const logger = createLogger({
        serviceName: baseConfig.serviceName,
        level: baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
        prettyPrint: baseConfig.nodeEnv === 'development',
    });

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

    // Initialize event consumer
    const consumer = new EventConsumer(rabbitConfig.url, emailService, logger);
    await consumer.connect();

    // Optional: Add HTTP endpoint for manual notifications
    app.post('/send-test-email', async (request, reply) => {
        const { to, subject, html } = request.body as any;
        await emailService.sendEmail(to, subject, html, { eventType: 'test' });
        return reply.send({ success: true });
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
