import { loadBaseConfig, loadDatabaseConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AutomationRepository } from './repository';
import { MatchingService } from './matching-service';
import { FraudDetectionService } from './fraud-service';
import { registerRoutes } from './routes';

async function main() {
    const baseConfig = loadBaseConfig('automation-service');
    const dbConfig = loadDatabaseConfig();

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

    // Swagger documentation
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Splits Network Automation API',
                description: 'AI matching, fraud detection, and automation rules',
                version: '1.0.0',
            },
            servers: [{ url: 'http://localhost:3007' }],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
    });

    // Health check
    app.get('/health', async () => {
        return { 
            status: 'healthy', 
            service: 'automation-service',
            timestamp: new Date().toISOString(),
        };
    });

    // Initialize repository and services
    const repository = new AutomationRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey!
    );

    const matchingService = new MatchingService(repository, logger);
    const fraudService = new FraudDetectionService(repository, logger);

    // Register routes
    registerRoutes(app, matchingService, fraudService, repository, logger);

    // Start server
    const HOST = process.env.HOST || '0.0.0.0';
    await app.listen({ port: baseConfig.port, host: HOST });

    logger.info(
        { port: baseConfig.port, host: HOST, env: baseConfig.nodeEnv },
        'Automation service started'
    );
}

main().catch((error) => {
    console.error('Failed to start automation service:', error);
    process.exit(1);
});
