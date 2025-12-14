import { loadBaseConfig, loadDatabaseConfig, loadStripeConfigFromVault } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { BillingRepository } from './repository';
import { BillingService } from './service';
import { registerRoutes } from './routes';

async function main() {
    const baseConfig = loadBaseConfig('billing-service');
    const dbConfig = loadDatabaseConfig();
    const stripeConfig = await loadStripeConfigFromVault();

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

    // Register Swagger
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Billing Service API',
                description: 'Subscription management and Stripe integration',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3004',
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'plans', description: 'Subscription plan management' },
                { name: 'subscriptions', description: 'Recruiter subscription management' },
                { name: 'webhooks', description: 'Stripe webhook endpoints' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    // Add raw body for Stripe webhooks
    app.addContentTypeParser(
        'application/json',
        { parseAs: 'buffer' },
        (req, body, done) => {
            try {
                const json = JSON.parse(body.toString());
                done(null, json);
            } catch (err: any) {
                err.statusCode = 400;
                done(err, undefined);
            }
        }
    );

    // Initialize repository and service
    const repository = new BillingRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey || dbConfig.supabaseAnonKey
    );
    const service = new BillingService(repository, stripeConfig.secretKey, logger);

    // Register routes
    registerRoutes(app, service, stripeConfig.webhookSecret);

    // Health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            // Check database connectivity
            await repository.healthCheck();
            return reply.status(200).send({
                status: 'healthy',
                service: 'billing-service',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ err: error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                service: 'billing-service',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // Start server
    try {
        await app.listen({ port: baseConfig.port, host: '0.0.0.0' });
        logger.info(`Billing service listening on port ${baseConfig.port}`);
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
}

main();
