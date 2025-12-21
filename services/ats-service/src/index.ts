import { loadBaseConfig, loadDatabaseConfig, loadRabbitMQConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AtsRepository } from './repository';
import { AtsService } from './service';
import { EventPublisher } from './events';
import { registerRoutes } from './routes';
import { CandidateOwnershipService } from './services/candidates/ownership-service';
import { PlacementCollaborationService } from './services/placements/collaboration-service';
import { PlacementLifecycleService } from './services/placements/lifecycle-service';
import * as Sentry from '@sentry/node';

async function main() {
    const baseConfig = loadBaseConfig('ats-service');
    const dbConfig = loadDatabaseConfig();
    const rabbitConfig = loadRabbitMQConfig();

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

    // Initialize Sentry if DSN is provided
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            environment: baseConfig.nodeEnv,
            release: process.env.SENTRY_RELEASE,
            tracesSampleRate: 0.1,
        });

        app.addHook('onError', async (request, reply, error) => {
            Sentry.captureException(error, {
                tags: { service: baseConfig.serviceName },
                extra: { path: request.url, method: request.method },
            });
        });
    }

    // Register Swagger
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'ATS Service API',
                description: 'Applicant Tracking System - Jobs, candidates, applications, and placements',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3002',
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'companies', description: 'Company management' },
                { name: 'jobs', description: 'Job/role management' },
                { name: 'candidates', description: 'Candidate management' },
                { name: 'applications', description: 'Job applications and pipeline' },
                { name: 'placements', description: 'Successful hires and placements' },
                { name: 'integrations', description: 'ATS integration management' },
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

    // Initialize event publisher
    const eventPublisher = new EventPublisher(rabbitConfig.url, logger);
    await eventPublisher.connect();

    // Initialize repository and service
    const repository = new AtsRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey || dbConfig.supabaseAnonKey
    );
    const service = new AtsService(repository, eventPublisher);
    
    // Phase 2 services
    const ownershipService = new CandidateOwnershipService(repository, eventPublisher);
    const collaborationService = new PlacementCollaborationService(repository, eventPublisher);
    const lifecycleService = new PlacementLifecycleService(repository, eventPublisher);

    // Register all routes (Phase 1, Phase 1.5, and Phase 2)
    registerRoutes(app, service, ownershipService, collaborationService, lifecycleService, repository, eventPublisher);

    // Health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            // Check database connectivity
            await repository.healthCheck();
            // Check RabbitMQ connectivity
            const rabbitHealthy = eventPublisher.isConnected();
            if (!rabbitHealthy) {
                throw new Error('RabbitMQ not connected');
            }
            return reply.status(200).send({
                status: 'healthy',
                service: 'ats-service',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ err: error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                service: 'ats-service',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        await eventPublisher.close();
        await app.close();
        process.exit(0);
    });

    // Start server
    try {
        await app.listen({ port: baseConfig.port, host: '0.0.0.0' });
        logger.info(`ATS service listening on port ${baseConfig.port}`);
    } catch (err) {
        logger.error(err);
        if (process.env.SENTRY_DSN) {
            Sentry.captureException(err as Error);
            await Sentry.flush(2000);
        }
        await eventPublisher.close();
        process.exit(1);
    }
}

main();
